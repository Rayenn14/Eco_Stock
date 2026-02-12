# Détail des Couches

## COUCHE 1 : YOLO (You Only Look Once)

### Qu'est-ce que YOLO ?

YOLO est un réseau de neurones spécialisé dans la **détection d'objets**. Il peut :
- Localiser des objets dans une image (bounding boxes)
- Classifier ces objets (tomate, oignon, etc.)
- Traiter en temps réel (~30 FPS)

### Comment ça marche ?

```
Image (640x640)
     │
     ▼
┌─────────────────────────────────────┐
│     Réseau Convolutif (Backbone)    │
│  Extrait des caractéristiques       │
│  - Formes                           │
│  - Couleurs                         │
│  - Textures                         │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│           Tête de Détection         │
│  Pour chaque zone de l'image :      │
│  - Y a-t-il un objet ?              │
│  - Quelle classe ?                  │
│  - Quelles coordonnées ?            │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│         Post-Processing (NMS)       │
│  - Filtre les doublons              │
│  - Garde les meilleures détections  │
└─────────────────────────────────────┘
     │
     ▼
Résultat: [{tomate, 95%, [x1,y1,x2,y2]}, ...]
```

### Notre modèle YOLO

- **Base** : YOLOv8n (nano - rapide et léger)
- **Entraîné sur** : ~10,000 images augmentées
- **Classes** : 7 ingrédients
  - tomate
  - oignon
  - ail
  - carotte
  - pomme_de_terre
  - oeuf
  - poulet
- **Performance** : 95.6% mAP (mean Average Precision)

### Fichiers associés

```
Entraînement : train.py
Modèle       : runs/detect/models/yolo_layer1/train/weights/best.pt
Inférence    : app_eco/yolo_detector.py
```

---

## COUCHE 2 : CNN (Convolutional Neural Network)

### Qu'est-ce qu'un CNN Classificateur ?

Contrairement à YOLO qui détecte ET localise, le CNN ne fait que **classifier** une image entière dans une catégorie.

### Comment ça marche ?

```
Image (224x224)
     │
     ▼
┌─────────────────────────────────────┐
│     Couches Convolutives            │
│  Extraient des features :           │
│  - Couleur (rouge = paprika ?)      │
│  - Texture (grains = poivre ?)      │
│  - Motifs                           │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│        Couches Fully Connected      │
│  Combinent les features pour        │
│  décider de la classe               │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│             Softmax                 │
│  Convertit en probabilités :        │
│  - paprika: 82%                     │
│  - poivre: 18%                      │
└─────────────────────────────────────┘
     │
     ▼
Résultat: {paprika, 82%}
```

### Notre modèle CNN

- **Base** : ResNet18 (pré-entraîné sur ImageNet)
- **Transfer Learning** : On réutilise les features générales et on entraîne la dernière couche
- **Classes** : 2 épices
  - paprika
  - poivre
- **Performance** : 100% accuracy (petit dataset mais bien équilibré)

### Pourquoi ResNet18 ?

- Léger et rapide
- Excellent pour le transfer learning
- Suffisant pour 2 classes

### Fichiers associés

```
Préparation  : prepare_cnn.py
Entraînement : train_cnn.py
Modèle       : models/cnn_spices/best.pt
Inférence    : app_eco/cnn_classifier.py
```

---

## COUCHE 3 : OCR (Optical Character Recognition)

### Qu'est-ce que l'OCR ?

L'OCR lit le texte présent dans une image. On utilise **EasyOCR** qui est pré-entraîné sur des millions de textes.

### Comment ça marche ?

```
Image avec texte
     │
     ▼
┌─────────────────────────────────────┐
│       Détection de zones texte      │
│  Trouve où il y a du texte          │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│       Reconnaissance caractères     │
│  Lit chaque zone détectée           │
│  "Tomates pelées" → texte brut      │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│       Matching mots-clés            │
│  "tomates" → ingrédient "tomate"    │
│  "pepper" → ingrédient "poivre"     │
└─────────────────────────────────────┘
     │
     ▼
Résultat: [{tomate, source: ocr}, ...]
```

### Mots-clés reconnus

```python
KEYWORD_MAPPING = {
    'tomate': ['tomate', 'tomato', 'tomates', 'pomodoro'],
    'oignon': ['oignon', 'onion', 'cipolla'],
    'ail': ['ail', 'garlic', 'aglio'],
    'poivre': ['poivre', 'pepper', 'black pepper'],
    'paprika': ['paprika', 'pimenton'],
    # ... etc
}
```

### Pas d'entraînement nécessaire

EasyOCR est déjà entraîné. On l'utilise directement.

### Fichiers associés

```
Inférence : app_eco/ocr_reader.py
Modèle    : Téléchargé automatiquement par EasyOCR
```

---

## COUCHE FUSION

### Rôle

Combine intelligemment les résultats des 3 couches pour :
- Éviter les doublons
- Calculer une confiance combinée
- Prioriser les détections confirmées par plusieurs sources

### Logique de fusion

```python
# Priorités
1. YOLO haute confiance (>90%) → Ingrédient confirmé
2. YOLO moyenne confiance (50-90%) → Vérifier avec OCR
3. CNN confiance (>70%) → Ajouter épice
4. OCR match → Ajouter ou confirmer

# Bonus multi-source
Si un ingrédient est détecté par 2+ sources → +5% confiance par source
```

### Exemple concret

```
Image: Photo d'une boîte de conserve de tomates avec des oignons à côté

YOLO détecte:
  - oignon: 92% ✓

CNN détecte:
  - (rien, pas d'épice visible)

OCR lit:
  - "Tomates pelées" → tomate ✓
  - "Ingredients: tomates, sel" → tomate ✓ (déjà), sel ✓

FUSION:
  - tomate: 85% (OCR x2)
  - oignon: 92% (YOLO)
  - sel: 80% (OCR)

RÉSULTAT FINAL:
  ['oignon', 'tomate', 'sel']
```

### Fichiers associés

```
Inférence : app_eco/fusion.py
```
