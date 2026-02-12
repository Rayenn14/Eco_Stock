# Guide d'Entraînement

## Vue d'ensemble

```
DONNÉES BRUTES           PRÉPARATION           ENTRAÎNEMENT           MODÈLE FINAL
    │                        │                      │                      │
    ▼                        ▼                      ▼                      ▼
┌─────────┐            ┌──────────┐           ┌──────────┐          ┌──────────┐
│ Images  │     →      │  Split   │     →     │  Train   │    →     │  best.pt │
│ brutes  │            │ train/val│           │ 50 epochs│          │          │
└─────────┘            └──────────┘           └──────────┘          └──────────┘
```

---

## Entraînement YOLO (Détection d'objets)

### Étape 1 : Préparer les données

Les images doivent être au format YOLO :
```
data/yolo_layer1/
├── images/
│   ├── train/
│   │   ├── img001.jpg
│   │   └── ...
│   └── val/
│       └── ...
├── labels/
│   ├── train/
│   │   ├── img001.txt   # Annotations
│   │   └── ...
│   └── val/
│       └── ...
└── yolo_layer1.yaml     # Configuration
```

### Format des annotations YOLO

Chaque fichier `.txt` contient une ligne par objet :
```
classe x_center y_center width height
```

Exemple `img001.txt` :
```
0 0.45 0.32 0.15 0.20    # tomate au centre-gauche
1 0.78 0.65 0.12 0.18    # oignon en bas-droite
```

Les coordonnées sont **normalisées** (0-1) par rapport à la taille de l'image.

### Étape 2 : Configurer le dataset

Fichier `yolo_layer1.yaml` :
```yaml
path: data/yolo_layer1
train: images/train
val: images/val

names:
  0: tomate
  1: oignon
  2: ail
  3: carotte
  4: pomme_de_terre
  5: oeuf
  6: poulet
```

### Étape 3 : Lancer l'entraînement

```python
from ultralytics import YOLO

# Charger le modèle pré-entraîné
model = YOLO("yolov8n.pt")

# Entraîner
model.train(
    data="data/yolo_layer1.yaml",
    epochs=50,              # Nombre d'epochs
    imgsz=640,              # Taille des images
    batch=16,               # Batch size
    patience=10,            # Early stopping
    device='cuda',          # GPU ou 'cpu'
    augment=True,           # Augmentation automatique
    project="models/yolo_layer1",
    name="train"
)
```

### Paramètres importants

| Paramètre | Valeur | Explication |
|-----------|--------|-------------|
| `epochs` | 50 | Nombre de passes sur le dataset |
| `imgsz` | 640 | Taille des images (plus grand = plus précis mais plus lent) |
| `batch` | 16 | Images par batch (réduire si erreur mémoire) |
| `patience` | 10 | Arrêt si pas d'amélioration pendant 10 epochs |
| `augment` | True | Augmentation automatique (flip, rotation, etc.) |

### Résultat

Après entraînement, le modèle est sauvegardé :
```
models/yolo_layer1/train/weights/
├── best.pt    # Meilleur modèle (celui qu'on utilise)
└── last.pt    # Dernier modèle
```

---

## Entraînement CNN (Classification)

### Étape 1 : Préparer les données

Structure par dossiers (un dossier = une classe) :
```
data/cnn_spices/
├── train/
│   ├── paprika/
│   │   ├── img001.jpg
│   │   └── ...
│   └── poivre/
│       └── ...
└── val/
    ├── paprika/
    │   └── ...
    └── poivre/
        └── ...
```

### Étape 2 : Équilibrer les classes

Si une classe a moins d'images, on peut :
1. **Sous-échantillonner** la classe majoritaire
2. **Sur-échantillonner** la classe minoritaire (augmentation)
3. **Pondérer** les classes dans la loss

Notre approche :
```python
# Calculer les poids de classe
class_counts = [26, 52]  # paprika, poivre
total = sum(class_counts)
weights = [total / (2 * c) for c in class_counts]
# weights = [1.5, 0.75]  # paprika compte 2x plus
```

### Étape 3 : Configurer les transformations

```python
from torchvision import transforms

# Augmentation FORTE pour le training
train_transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.RandomCrop(224),           # Crop aléatoire
    transforms.RandomHorizontalFlip(),    # Flip horizontal
    transforms.RandomRotation(30),        # Rotation ±30°
    transforms.ColorJitter(               # Variations couleur
        brightness=0.3,
        contrast=0.3,
        saturation=0.3
    ),
    transforms.ToTensor(),
    transforms.Normalize(                 # Normalisation ImageNet
        [0.485, 0.456, 0.406],
        [0.229, 0.224, 0.225]
    )
])

# Pas d'augmentation pour la validation
val_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])
```

### Étape 4 : Transfer Learning

On utilise un modèle **pré-entraîné** sur ImageNet et on remplace la dernière couche :

```python
from torchvision import models

# Charger ResNet18 pré-entraîné
model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

# Remplacer la dernière couche (1000 classes → 2 classes)
model.fc = nn.Linear(model.fc.in_features, 2)
```

Pourquoi ça marche :
- Les premières couches ont appris des features générales (bords, formes, textures)
- On garde ces features et on entraîne seulement la classification finale

### Étape 5 : Boucle d'entraînement

```python
for epoch in range(30):
    # Training
    model.train()
    for images, labels in train_loader:
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

    # Validation
    model.eval()
    with torch.no_grad():
        for images, labels in val_loader:
            outputs = model(images)
            # Calculer accuracy...

    # Sauvegarder si meilleur
    if val_acc > best_acc:
        torch.save(model.state_dict(), "best.pt")
```

### Résultat

```
models/cnn_spices/
└── best.pt    # Modèle entraîné (contient weights + classes)
```

---

## Augmentation de Données

L'augmentation **multiplie virtuellement** le nombre d'images en appliquant des transformations aléatoires.

### Transformations utilisées

| Transformation | Effet | Exemple |
|----------------|-------|---------|
| Flip horizontal | Miroir | Tomate à gauche → tomate à droite |
| Rotation | Tourne l'image | ±30 degrés |
| Crop aléatoire | Zoom/recadrage | Focus sur une partie |
| Brightness | Luminosité | Plus clair/sombre |
| Contrast | Contraste | Plus/moins contrasté |
| Saturation | Couleurs | Plus/moins vives |

### Pourquoi c'est important

```
Sans augmentation:
  31 images de paprika → 31 variations vues
  Le modèle mémorise au lieu d'apprendre

Avec augmentation:
  31 images × ~10 transformations par epoch × 30 epochs
  = ~9300 variations vues
  Le modèle apprend des features généralisables
```

---

## Métriques d'évaluation

### YOLO : mAP (mean Average Precision)

```
mAP50 = 95.6%
```
Signifie : 95.6% des détections avec IoU > 0.5 sont correctes

### CNN : Accuracy

```
Accuracy = 100%
```
Signifie : 100% des images de validation correctement classifiées

### Attention au surapprentissage

Si training accuracy >> validation accuracy :
- Le modèle mémorise au lieu d'apprendre
- Solutions : plus de données, plus d'augmentation, early stopping

---

## Résumé des commandes

```bash
# 1. Préparer les données
python prepare_cnn.py

# 2. Entraîner YOLO
python train.py

# 3. Entraîner CNN
python train_cnn.py

# 4. Tester l'application
python app_complete.py
```
