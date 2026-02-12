# Detection Out-of-Distribution (OOD)

## Le Problème

Avec un classificateur CNN classique à 2 classes (paprika, poivre), le modèle est **forcé** de choisir une classe, même si l'image n'est pas une épice.

```
Image de poulet rôti
        │
        ▼
┌─────────────────┐
│      CNN        │
│  paprika: 60%   │  ← Le modèle DOIT choisir
│  poivre: 40%    │
└─────────────────┘
        │
        ▼
  Résultat: "paprika 60%"  ← FAUX POSITIF!
```

**Pourquoi ?** La fonction softmax normalise les sorties pour qu'elles somment à 100%. Donc même si le modèle n'a jamais vu de poulet, il dira quand même "paprika" ou "poivre".

---

## La Solution : Prototypes et Distance

### Concept

Pendant l'entraînement, on calcule un **prototype** (centroïde) pour chaque classe dans l'espace des features.

```
Espace des features (512 dimensions)

        ●  ●
       ●  ●  ●    ← Images de paprika
        ● ⊕ ●        ⊕ = Prototype paprika
         ●

                    ●  ●
                   ●  ●  ●   ← Images de poivre
                    ● ⊗ ●       ⊗ = Prototype poivre
                     ●


              ★  ← Image de poulet (loin des deux prototypes!)
```

### Algorithme

1. **Entraînement** :
   - Entraîner le CNN normalement
   - Extraire les features de toutes les images d'entraînement
   - Calculer le **prototype** (moyenne des features) pour chaque classe
   - Calculer le **rayon** (distance moyenne + 2*écart-type)

2. **Inférence** :
   - Extraire les features de l'image
   - Calculer la distance aux prototypes
   - Si distance > rayon × marge → **REJET** (pas une épice)
   - Sinon → classification normale

```
Nouvelle image
      │
      ▼
┌─────────────────────────────────────┐
│     Extracteur de Features          │
│     (ResNet18 sans dernière couche) │
└─────────────────────────────────────┘
      │
      ▼
   Features (vecteur 512D)
      │
      ├──────────────────────────────┐
      ▼                              ▼
┌──────────────┐              ┌──────────────┐
│ Distance au  │              │ Distance au  │
│ prototype    │              │ prototype    │
│ paprika      │              │ poivre       │
└──────────────┘              └──────────────┘
      │                              │
      └──────────────┬───────────────┘
                     ▼
            Distance minimale
                     │
                     ▼
        ┌────────────────────────┐
        │  distance < rayon ?    │
        └────────────────────────┘
               │           │
              OUI         NON
               │           │
               ▼           ▼
        Classification   REJET
         normale       (pas épice)
```

---

## Implémentation

### Pendant l'entraînement (train_cnn.py)

```python
# 1. Créer l'extracteur de features
feature_extractor = nn.Sequential(*list(model.children())[:-1])

# 2. Extraire les features de toutes les images
class_features = {0: [], 1: []}  # paprika, poivre
for images, labels in dataloader:
    features = feature_extractor(images)
    features = features.view(features.size(0), -1)  # Flatten
    for feat, label in zip(features, labels):
        class_features[label].append(feat)

# 3. Calculer les prototypes et rayons
prototypes = {}
radii = {}
for class_id, features in class_features.items():
    features = np.array(features)

    # Prototype = moyenne des features
    prototype = features.mean(axis=0)
    prototypes[class_id] = prototype

    # Rayon = distance moyenne + 2*std
    distances = np.linalg.norm(features - prototype, axis=1)
    radius = distances.mean() + 2 * distances.std()
    radii[class_id] = radius

# 4. Sauvegarder avec le modèle
checkpoint = {
    'model_state_dict': model.state_dict(),
    'classes': ['paprika', 'poivre'],
    'prototypes': prototypes,
    'radii': radii
}
torch.save(checkpoint, "best.pt")
```

### Pendant l'inférence (cnn_classifier.py)

```python
def classify(self, image, ood_margin=1.2):
    # 1. Extraire les features
    features = self.feature_extractor(image)

    # 2. Calculer la distance aux prototypes
    min_ratio = float('inf')
    for class_id, prototype in self.prototypes.items():
        distance = np.linalg.norm(features - prototype)
        radius = self.radii[class_id]
        ratio = distance / radius

        if ratio < min_ratio:
            min_ratio = ratio

    # 3. Vérifier si dans la distribution
    if min_ratio > ood_margin:  # Trop loin = pas une épice
        return []  # REJET

    # 4. Classification normale si accepté
    return self._classify_standard(image)
```

---

## Paramètres

### `ood_margin` (marge OOD)

Contrôle la tolérance du rejet. **Plus la valeur est basse, plus le système est strict.**

| Valeur | Effet |
|--------|-------|
| 0.5 | Très strict - rejette beaucoup |
| 0.8 | Strict |
| **1.0** | **Équilibré (défaut recommandé avec radius strict)** |
| 1.5 | Permissif |
| 2.0 | Très permissif |

**Note :** Avec un radius calculé en `mean + 0.3*std`, une marge de 1.0 est suffisante. Le radius ultra-strict fait le travail de rejet.

### `radius` (rayon)

Calculé comme : `moyenne(distances) + 0.3 * std(distances)`

Cela couvre environ **60%** des images d'entraînement de chaque classe, rendant le rejet **ultra-strict**.

**Formules possibles :**
| Formule | Couverture | Usage |
|---------|------------|-------|
| mean + 0.3*std | ~60% | Ultra-strict (défaut) |
| mean + 0.5*std | ~70% | Strict |
| mean + 1*std | ~84% | Modéré |
| mean + 2*std | ~95% | Permissif |

---

## Avantages de cette méthode

1. **Pas besoin de classe "autre"** - On utilise la géométrie de l'espace des features
2. **Pas de données négatives** - Pas besoin de collecter des images de "non-épices"
3. **Interprétable** - Le ratio de distance explique pourquoi une image est rejetée
4. **Robuste** - Basé sur des statistiques des features, pas juste sur softmax

---

## Limites

1. **Calibration** - Le rayon dépend de la qualité de l'entraînement
2. **Distribution** - Suppose que les features sont approximativement sphériques
3. **Nouveauté** - Peut rejeter de vraies épices si elles sont très différentes des images d'entraînement

---

## Alternatives (pour aller plus loin)

| Méthode | Description | Complexité |
|---------|-------------|------------|
| **Prototypes** (notre choix) | Distance aux centroides | Simple |
| **Mahalanobis** | Distance avec covariance | Moyen |
| **Energy OOD** | Score basé sur l'énergie des logits | Moyen |
| **Autoencoder** | Erreur de reconstruction | Complexe |
| **Ensemble** | Plusieurs modèles + incertitude | Complexe |

---

## Résumé

```
AVANT (V1):
  Image → CNN → softmax → "paprika 60%" (même si c'est du poulet)

APRÈS (V2 avec OOD):
  Image → Features → Distance aux prototypes
                          │
                    Distance OK?
                     /        \
                   OUI        NON
                    │          │
                    ▼          ▼
             "paprika 95%"   [] (vide)
```

**C'est la bonne pratique** utilisée en production pour les systèmes de classification avec classes limitées.
