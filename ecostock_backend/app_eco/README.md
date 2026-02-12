# APP_ECO - Module de Detection d'Ingredients

Module Python reutilisable pour detecter les ingredients dans une image.
Combine YOLO (detection) + CNN (classification epices) + OCR (lecture texte).

## Installation

```bash
pip install -r requirements.txt
```

## Usage Rapide

```python
from app_eco import IngredientDetector

# Initialiser le detecteur
detector = IngredientDetector()

# Detecter les ingredients dans une image
results = detector.detect("photo_cuisine.jpg")

# Liste des ingredients
print(results['ingredients'])
# ['tomate', 'oignon', 'poulet', 'paprika']

# Details par source
print(results['details']['yolo'])   # Detections YOLO
print(results['details']['cnn'])    # Classifications CNN
print(results['details']['ocr'])    # Textes OCR
```

## Usage Simplifie

```python
from app_eco import IngredientDetector

detector = IngredientDetector()

# Juste la liste des ingredients
ingredients = detector.detect_ingredients_only("image.jpg")
print(ingredients)  # ['tomate', 'poulet', 'oignon']
```

## Integration dans une App de Recettes

```python
from app_eco import IngredientDetector

class RecipeApp:
    def __init__(self):
        self.detector = IngredientDetector(use_ocr=True)

    def suggest_recipes(self, image_path):
        # Detecter les ingredients
        results = self.detector.detect(image_path)
        ingredients = results['ingredients']

        # Chercher des recettes avec ces ingredients
        recipes = self.search_recipes(ingredients)
        return recipes

    def search_recipes(self, ingredients):
        # Votre logique de recherche de recettes
        pass
```

## Configuration Avancee

```python
detector = IngredientDetector(
    yolo_model_path="chemin/vers/yolo.pt",      # Modele YOLO custom
    cnn_model_path="chemin/vers/cnn.pt",        # Modele CNN custom
    use_ocr=True,                                # Activer/desactiver OCR
    ocr_languages=['fr', 'en'],                  # Langues OCR
    device='cuda'                                # 'cuda', 'cpu' ou 'auto'
)

# Detection avec seuils personnalises
results = detector.detect(
    "image.jpg",
    yolo_conf=0.6,    # Seuil YOLO
    cnn_conf=0.8,     # Seuil CNN
    ocr_conf=0.5,     # Seuil OCR
    return_annotated=True  # Retourner image annotee
)

# Sauvegarder l'image annotee
import cv2
cv2.imwrite("resultat.jpg", results['annotated_image'])
```

## Classes Detectees

### YOLO (Ingredients visibles)
- tomate
- oignon
- ail
- carotte
- pomme_de_terre
- oeuf
- poulet

### CNN (Epices)
- paprika
- poivre

### OCR (Texte)
Detecte automatiquement les mots-cles d'ingredients dans le texte visible.

## Structure des Resultats

```python
{
    'ingredients': ['tomate', 'oignon', 'paprika'],
    'details': {
        'yolo': [
            {'name': 'tomate', 'confidence': 0.95, 'bbox': [x1,y1,x2,y2]},
            {'name': 'oignon', 'confidence': 0.87, 'bbox': [x1,y1,x2,y2]}
        ],
        'cnn': [
            {'name': 'paprika', 'confidence': 0.92}
        ],
        'ocr': [
            {'name': 'sel', 'confidence': 0.8, 'matched_keyword': 'salt'}
        ]
    },
    'confidence_scores': {
        'tomate': {'confidence': 0.95, 'sources': ['yolo']},
        'paprika': {'confidence': 0.92, 'sources': ['cnn']}
    }
}
```

## Fichiers du Module

```
app_eco/
├── __init__.py              # Interface principale
├── ingredient_detector.py   # Classe principale
├── yolo_detector.py         # Detection YOLO
├── cnn_classifier.py        # Classification CNN
├── ocr_reader.py            # Lecture OCR
├── fusion.py                # Fusion multi-source
├── requirements.txt         # Dependances
└── README.md                # Documentation
```

## Modeles Requis

Les modeles doivent etre places aux chemins par defaut ou specifies lors de l'initialisation:

- YOLO: `runs/detect/models/yolo_layer1/train/weights/best.pt`
- CNN: `models/cnn_spices/best.pt`
