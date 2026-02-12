# Autres Optimisations Possibles

## État actuel du système

| Composant | Statut | Optimisation appliquée |
|-----------|--------|----------------------|
| YOLO Layer 1 | ✅ Fait | Augmentation, transfer learning |
| CNN | ✅ Fait | **Detection OOD (prototypes, marge=0.6)** |
| OCR | ✅ Fait | EasyOCR + **dictionnaire 100+ ingrédients** |
| Fusion | ✅ Fait | Logique multi-source |
| YOLO Layer 2 | ❌ Non fait | - |

---

## La detection OOD est-elle la seule optimisation nécessaire ?

**Pour le CNN : OUI**, c'est la principale et la plus importante.

**Pour le système global**, il y a d'autres optimisations possibles mais moins critiques :

---

## Optimisations par composant

### 1. YOLO Layer 1 (Détection)

**Déjà optimisé :**
- Transfer learning depuis YOLOv8n pré-entraîné
- Augmentation de données
- Early stopping

**Optimisations supplémentaires possibles :**

| Optimisation | Impact | Effort |
|--------------|--------|--------|
| Plus de données | +5-10% mAP | Élevé |
| YOLOv8s au lieu de n | +2-3% mAP | Faible (mais plus lent) |
| Test-Time Augmentation | +1-2% mAP | Faible |
| Hyperparameter tuning | +1-3% mAP | Moyen |

**Notre mAP actuel : 95.6%** - C'est déjà très bon.

---

### 2. CNN Classification (Épices)

**Déjà optimisé :**
- Transfer learning (ResNet18)
- Augmentation forte
- Poids de classe équilibrés
- **Detection OOD (prototypes)** ← L'optimisation clé

**Optimisations supplémentaires possibles :**

| Optimisation | Impact | Effort |
|--------------|--------|--------|
| Plus de classes d'épices | Élargit les capacités | Données requises |
| EfficientNet au lieu de ResNet | Légèrement meilleur | Faible |
| Mixup / CutMix augmentation | +1-2% accuracy | Moyen |
| Knowledge distillation | Modèle plus petit | Élevé |

---

### 3. OCR (Lecture de texte)

**Déjà optimisé :**
- EasyOCR pré-entraîné (état de l'art)
- **Dictionnaire étendu : 100+ ingrédients** en FR/EN/IT/ES
  - Légumes (25+)
  - Fruits (17+)
  - Protéines (16+)
  - Produits laitiers (8+)
  - Épices et aromates (30+)
  - Féculents et céréales (10+)
  - Légumineuses (6+)
  - Condiments et sauces (9+)
  - Noix et graines (10+)

**Optimisations supplémentaires possibles :**

| Optimisation | Impact | Effort |
|--------------|--------|--------|
| Prétraitement image (binarisation) | +5-10% précision sur texte difficile | Faible |
| PaddleOCR (alternative) | Plus rapide | Faible |
| Fine-tuning sur textes alimentaires | +10-15% | Élevé |
| ~~Élargir le dictionnaire de mots-clés~~ | ✅ Fait | ~~Faible~~ |

---

### 4. Fusion

**Déjà optimisé :**
- Dédoublonnage
- Boost multi-source
- Seuils de confiance

**Optimisations supplémentaires possibles :**

| Optimisation | Impact | Effort |
|--------------|--------|--------|
| Fusion apprise (ML) | Meilleure combinaison | Élevé (données requises) |
| Règles contextuelles | Ex: "si oignon alors probablement cuisine" | Moyen |
| Feedback utilisateur | Amélioration continue | Élevé |

---

### 5. YOLO Layer 2 (Non implémenté)

**Impact potentiel :** Améliorerait significativement la détection d'épices dans les bocaux/emballages.

**Nécessite :** Dataset annoté de bocaux/emballages.

---

## Résumé des priorités

### Haute priorité (fait) ✅
1. **Detection OOD pour CNN** - Évite les faux positifs (marge=0.6)
2. **Dictionnaire OCR étendu** - 100+ ingrédients multilingues

### Moyenne priorité (optionnel)
3. **YOLO Layer 2** - Pour les bocaux/emballages
4. **Plus de classes CNN** - Plus d'épices (cumin, curry, etc.)

### Basse priorité
5. Modèles plus gros (YOLOv8m, EfficientNet)
6. Fine-tuning OCR
7. Fusion apprise

---

## Réponse courte

> **"Est-ce la seule optimisation à faire ?"**

Pour le **CNN** : **Oui**, la detection OOD par prototypes est l'optimisation essentielle. Sans elle, le système donne des faux positifs systématiques.

Pour le **système global** : Le système est fonctionnel. Les autres optimisations sont des améliorations marginales ou nécessitent des données supplémentaires.

---

## Schéma final du système optimisé

```
                         IMAGE
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
      YOLO Layer 1    CNN + OOD          OCR
      (7 ingrédients) (2 épices)    (100+ ingrédients)
           │               │               │
           │          Prototype            │
           │          distance?            │
           │         (marge=0.6)           │
           │           /    \              │
           │        OK    REJET            │
           │         │      │              │
           │         ▼      ▼              │
           │     épice    rien             │
           │               │               │
           └───────────────┼───────────────┘
                           │
                           ▼
                       FUSION
                           │
                           ▼
                    INGRÉDIENTS
                    (sans faux positifs)
```
