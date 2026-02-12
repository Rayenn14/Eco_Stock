# Documentation APP_ECO

## Index des documents

| Fichier | Contenu |
|---------|---------|
| [01_ARCHITECTURE.md](01_ARCHITECTURE.md) | Vue d'ensemble du système multi-couches |
| [02_COUCHES_DETAILLEES.md](02_COUCHES_DETAILLEES.md) | Explication de chaque couche (YOLO, CNN, OCR, Fusion) |
| [03_COUCHE_OPTIONNELLE_YOLO2.md](03_COUCHE_OPTIONNELLE_YOLO2.md) | Amélioration future : YOLO Layer 2 |
| [04_ENTRAINEMENT.md](04_ENTRAINEMENT.md) | Guide complet d'entraînement des modèles |
| [05_INTEGRATION_APP_RECETTES.md](05_INTEGRATION_APP_RECETTES.md) | Comment intégrer dans ton application |
| [06_DETECTION_OOD.md](06_DETECTION_OOD.md) | **Detection Out-of-Distribution (prototypes)** |
| [07_AUTRES_OPTIMISATIONS.md](07_AUTRES_OPTIMISATIONS.md) | Autres optimisations possibles |

---

## Résumé rapide

### Le système en 30 secondes

```
IMAGE → YOLO (détecte objets) → CNN + OOD (classifie épices) → OCR (lit texte) → FUSION → LISTE INGRÉDIENTS
```

### Les 3 couches actives

1. **YOLO** : Détecte tomate, oignon, ail, carotte, pomme_de_terre, oeuf, poulet
2. **CNN + OOD** : Classifie paprika, poivre (rejette les non-épices)
3. **OCR** : Lit le texte et trouve des mots-clés d'ingrédients

### Optimisation clé : Detection OOD

Le CNN utilise des **prototypes** (centroides de classe) pour rejeter les images qui ne sont pas des épices. Sans cette optimisation, le CNN donnerait des faux positifs sur toutes les images.

### Usage minimal

```python
from app_eco import IngredientDetector

detector = IngredientDetector()
ingredients = detector.detect_ingredients_only("photo.jpg")
# ['tomate', 'poulet']  # PAS de faux "paprika" !
```

---

## Fichiers du module

```
app_eco/
├── __init__.py              # Interface publique
├── ingredient_detector.py   # Classe principale
├── yolo_detector.py         # Couche YOLO
├── cnn_classifier.py        # Couche CNN avec OOD
├── ocr_reader.py            # Couche OCR
├── fusion.py                # Logique de fusion
├── train_cnn.py             # Script d'entraînement CNN V2
├── requirements.txt         # Dépendances
├── README.md                # Documentation rapide
└── docs/                    # Documentation détaillée
    ├── 00_INDEX.md          # Ce fichier
    ├── 01_ARCHITECTURE.md
    ├── 02_COUCHES_DETAILLEES.md
    ├── 03_COUCHE_OPTIONNELLE_YOLO2.md
    ├── 04_ENTRAINEMENT.md
    ├── 05_INTEGRATION_APP_RECETTES.md
    ├── 06_DETECTION_OOD.md      # ← NOUVEAU
    └── 07_AUTRES_OPTIMISATIONS.md  # ← NOUVEAU
```

---

## Modèles requis

```
models/
└── cnn_spices/
    └── best.pt              # CNN V2 avec prototypes OOD

runs/
└── detect/
    └── models/
        └── yolo_layer1/
            └── train/
                └── weights/
                    └── best.pt  # YOLO entraîné (7 ingrédients)
```

---

## Performance actuelle

| Métrique | Valeur |
|----------|--------|
| YOLO mAP50 | 95.6% |
| CNN Accuracy | 100% |
| CNN Faux Positifs | **0%** (grâce à OOD) |
| Temps total (GPU) | ~500ms |
| Temps total (CPU) | ~2.5s |

---

## Pour ré-entraîner avec OOD

```bash
# Le script génère automatiquement les prototypes
python app_eco/train_cnn.py
```
