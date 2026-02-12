# Intégration dans une App de Recettes

## Vue d'ensemble

Le module `app_eco` est conçu pour être facilement intégré dans n'importe quelle application Python.

```
┌─────────────────────────────────────────────────────────────┐
│                   TON APPLICATION                           │
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   Upload    │ →   │  app_eco    │ →   │  Recherche  │   │
│  │   Image     │     │  Détection  │     │  Recettes   │   │
│  └─────────────┘     └─────────────┘     └─────────────┘   │
│                             │                               │
│                             ▼                               │
│                    ['tomate', 'poulet']                     │
│                             │                               │
│                             ▼                               │
│              "Voici 5 recettes avec ces ingrédients"       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Installation

### 1. Copier le module

Copie le dossier `app_eco/` dans ton projet :
```
ton_projet/
├── app_eco/           # Module de détection
│   ├── __init__.py
│   ├── ingredient_detector.py
│   └── ...
├── models/            # Modèles entraînés
│   └── cnn_spices/
│       └── best.pt
├── runs/              # Modèle YOLO
│   └── detect/...
└── ton_app.py
```

### 2. Installer les dépendances

```bash
pip install torch torchvision ultralytics opencv-python easyocr
```

---

## Usage de base

```python
from app_eco import IngredientDetector

# Initialiser (charge les modèles)
detector = IngredientDetector()

# Détecter dans une image
results = detector.detect("photo_frigo.jpg")

# Obtenir la liste des ingrédients
ingredients = results['ingredients']
print(ingredients)
# ['tomate', 'oignon', 'poulet', 'paprika']
```

---

## Exemples d'intégration

### Exemple 1 : Application Flask simple

```python
from flask import Flask, request, jsonify
from app_eco import IngredientDetector

app = Flask(__name__)
detector = IngredientDetector()

@app.route('/detect', methods=['POST'])
def detect_ingredients():
    image = request.files['image']

    # Sauvegarder temporairement
    temp_path = "/tmp/upload.jpg"
    image.save(temp_path)

    # Détecter
    results = detector.detect(temp_path)

    return jsonify({
        'ingredients': results['ingredients'],
        'count': len(results['ingredients'])
    })

if __name__ == '__main__':
    app.run()
```

### Exemple 2 : Avec recherche de recettes

```python
from app_eco import IngredientDetector

class RecipeApp:
    def __init__(self, recipe_database):
        self.detector = IngredientDetector()
        self.recipes = recipe_database

    def suggest_recipes_from_image(self, image_path):
        # Étape 1 : Détecter les ingrédients
        results = self.detector.detect(image_path)
        detected = results['ingredients']

        # Étape 2 : Chercher des recettes
        matching_recipes = []
        for recipe in self.recipes:
            # Calculer le score de correspondance
            recipe_ingredients = set(recipe['ingredients'])
            detected_set = set(detected)

            match_count = len(recipe_ingredients & detected_set)
            match_ratio = match_count / len(recipe_ingredients)

            if match_ratio >= 0.5:  # Au moins 50% des ingrédients
                matching_recipes.append({
                    'recipe': recipe,
                    'match_ratio': match_ratio,
                    'missing': list(recipe_ingredients - detected_set)
                })

        # Trier par correspondance
        matching_recipes.sort(key=lambda x: x['match_ratio'], reverse=True)

        return matching_recipes

# Usage
app = RecipeApp(recipe_database=[
    {'name': 'Poulet aux tomates', 'ingredients': ['poulet', 'tomate', 'oignon', 'ail']},
    {'name': 'Omelette', 'ingredients': ['oeuf', 'sel', 'poivre']},
    # ...
])

suggestions = app.suggest_recipes_from_image("ma_photo.jpg")
for s in suggestions[:3]:
    print(f"{s['recipe']['name']} - {s['match_ratio']*100:.0f}% match")
    print(f"  Manque: {s['missing']}")
```

### Exemple 3 : API REST complète

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
from app_eco import IngredientDetector
import cv2
import numpy as np

app = Flask(__name__)
CORS(app)

detector = IngredientDetector()

@app.route('/api/detect', methods=['POST'])
def detect():
    """Endpoint principal de détection."""
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']

    # Lire l'image depuis le buffer
    img_bytes = file.read()
    img_array = cv2.imdecode(
        np.frombuffer(img_bytes, np.uint8),
        cv2.IMREAD_COLOR
    )

    # Détecter
    results = detector.detect(
        img_array,
        yolo_conf=0.5,
        cnn_conf=0.6,
        ocr_conf=0.5
    )

    return jsonify({
        'success': True,
        'ingredients': results['ingredients'],
        'details': {
            'yolo_detections': len(results['details']['yolo']),
            'cnn_classifications': len(results['details']['cnn']),
            'ocr_matches': len(results['details']['ocr'])
        },
        'confidence_scores': results['confidence_scores']
    })

@app.route('/api/detect/simple', methods=['POST'])
def detect_simple():
    """Endpoint simplifié - retourne juste la liste."""
    file = request.files['image']
    img_bytes = file.read()
    img_array = cv2.imdecode(
        np.frombuffer(img_bytes, np.uint8),
        cv2.IMREAD_COLOR
    )

    ingredients = detector.detect_ingredients_only(img_array)

    return jsonify({'ingredients': ingredients})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

---

## Configuration avancée

### Désactiver l'OCR (plus rapide)

```python
detector = IngredientDetector(use_ocr=False)
```

### Utiliser des modèles personnalisés

```python
detector = IngredientDetector(
    yolo_model_path="/chemin/vers/mon_yolo.pt",
    cnn_model_path="/chemin/vers/mon_cnn.pt"
)
```

### Forcer CPU (si pas de GPU)

```python
detector = IngredientDetector(device='cpu')
```

### Ajuster les seuils de confiance

```python
results = detector.detect(
    image,
    yolo_conf=0.7,   # Plus strict pour YOLO
    cnn_conf=0.8,    # Plus strict pour CNN
    ocr_conf=0.6     # Plus strict pour OCR
)
```

---

## Gestion des erreurs

```python
from app_eco import IngredientDetector

try:
    detector = IngredientDetector()
except FileNotFoundError as e:
    print(f"Modèle manquant: {e}")
    print("Vérifiez que les fichiers .pt sont présents")

try:
    results = detector.detect("image_inexistante.jpg")
except ValueError as e:
    print(f"Erreur image: {e}")
```

---

## Performance

### Temps de traitement typique

| Composant | GPU (RTX 3080) | CPU |
|-----------|----------------|-----|
| YOLO | ~20ms | ~200ms |
| CNN | ~5ms | ~50ms |
| OCR | ~500ms | ~2000ms |
| **Total** | **~525ms** | **~2250ms** |

### Optimisations possibles

1. **Désactiver l'OCR** si pas besoin de lire le texte : `-400ms`
2. **Batch processing** pour plusieurs images
3. **Mise en cache** des résultats fréquents

---

## Structure des résultats

```python
{
    # Liste simple des ingrédients
    'ingredients': ['tomate', 'oignon', 'poulet', 'paprika'],

    # Scores de confiance détaillés
    'confidence_scores': {
        'tomate': {
            'confidence': 0.95,
            'sources': ['yolo'],
            'yolo_conf': 0.95
        },
        'paprika': {
            'confidence': 0.88,
            'sources': ['cnn'],
            'cnn_conf': 0.88
        }
    },

    # Détails bruts par source
    'details': {
        'yolo': [
            {'name': 'tomate', 'confidence': 0.95, 'bbox': [100, 200, 300, 400]},
            {'name': 'oignon', 'confidence': 0.87, 'bbox': [500, 100, 700, 300]}
        ],
        'cnn': [
            {'name': 'paprika', 'confidence': 0.88}
        ],
        'ocr': [
            {'name': 'sel', 'confidence': 0.8, 'matched_keyword': 'salt'}
        ]
    }
}
```

---

## Checklist d'intégration

- [ ] Copier `app_eco/` dans ton projet
- [ ] Copier les modèles (`models/` et `runs/`)
- [ ] Installer les dépendances
- [ ] Tester avec `detector.detect("test.jpg")`
- [ ] Intégrer dans ton application
- [ ] Gérer les erreurs (image invalide, modèle manquant)
- [ ] Optimiser si nécessaire (désactiver OCR, etc.)
