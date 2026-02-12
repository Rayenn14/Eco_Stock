# Couche Optionnelle : YOLO Layer 2

## Statut actuel : NON IMPLÉMENTÉE

Cette couche n'est pas encore implémentée car elle nécessite un dataset spécifique qui n'existe pas encore.

---

## Qu'est-ce que YOLO Layer 2 ?

YOLO Layer 2 serait un **deuxième modèle YOLO** spécialisé dans la détection de **zones d'intérêt** pour les épices et emballages.

### Classes à détecter

```
- bocal_epices    : Bocal/pot contenant des épices
- epice_poudre    : Zone avec de la poudre d'épice visible
- emballage       : Sachet, boîte, paquet d'épices
- etiquette       : Zone de texte/étiquette lisible
```

---

## Pourquoi cette couche améliorerait le système ?

### Problème actuel

Actuellement, le CNN analyse **l'image entière** pour classifier les épices. Cela pose problème si :
- L'image contient plusieurs éléments (légumes + épices)
- L'épice est dans un petit coin de l'image
- Il y a un bocal fermé (on voit le bocal, pas l'épice)

### Solution avec YOLO Layer 2

```
AVANT (sans Layer 2):
┌─────────────────────────────────────┐
│  Image complète                     │
│  ┌─────┐                            │
│  │épice│     [tomate]    [oignon]   │
│  └─────┘                            │
│                                     │
└─────────────────────────────────────┘
        │
        ▼
   CNN sur image entière
   (confus car beaucoup d'éléments)
        │
        ▼
   Résultat: paprika 45% (pas fiable)


APRÈS (avec Layer 2):
┌─────────────────────────────────────┐
│  Image complète                     │
│  ┌─────┐                            │
│  │épice│     [tomate]    [oignon]   │
│  └─────┘                            │
│     ↑                               │
│  YOLO Layer 2 détecte               │
│  "bocal_epices" ici                 │
└─────────────────────────────────────┘
        │
        ▼
   Crop de la zone détectée
   ┌─────┐
   │épice│
   └─────┘
        │
        ▼
   CNN sur le crop seulement
        │
        ▼
   Résultat: paprika 95% (précis!)
```

---

## Architecture avec YOLO Layer 2

```
                    IMAGE
                      │
          ┌──────────┴──────────┐
          ▼                     ▼
    YOLO Layer 1          YOLO Layer 2
    (Ingrédients)         (Zones épices)
          │                     │
          │               ┌─────┴─────┐
          │               ▼           ▼
          │           [crop 1]    [crop 2]
          │               │           │
          │               ▼           ▼
          │              CNN         OCR
          │          (classifier) (lire texte)
          │               │           │
          └───────────────┴─────┬─────┘
                                ▼
                            FUSION
                                │
                                ▼
                          RÉSULTAT
```

---

## Comment implémenter cette couche ?

### 1. Collecter des données

Tu aurais besoin de **~500-1000 images** avec :
- Des bocaux d'épices
- Des sachets d'épices
- Des emballages avec étiquettes
- Des épices en poudre visibles

### 2. Annoter les images

Utiliser un outil comme **LabelImg** ou **Roboflow** pour dessiner des bounding boxes :

```
┌────────────────────────────────┐
│                                │
│   ┌──────────┐                 │
│   │ bocal    │    ┌─────────┐  │
│   │ epices   │    │emballage│  │
│   └──────────┘    └─────────┘  │
│                                │
└────────────────────────────────┘
```

### 3. Entraîner YOLO Layer 2

```python
# train_yolo_layer2.py
from ultralytics import YOLO

model = YOLO("yolov8n.pt")
model.train(
    data="data/yolo_layer2.yaml",
    epochs=50,
    imgsz=640,
    batch=16
)
```

### 4. Intégrer dans le pipeline

Modifier `ingredient_detector.py` pour :
1. Exécuter YOLO Layer 2 sur l'image
2. Pour chaque zone détectée, extraire un crop
3. Passer le crop au CNN ou à l'OCR
4. Fusionner avec les autres résultats

---

## Dataset suggéré

### Sources possibles

1. **Google Images** : Chercher "spice jar", "épices bocal"
2. **Roboflow Universe** : Datasets existants de bocaux
3. **Prendre tes propres photos** : Plus personnalisé

### Structure attendue

```
data/
├── yolo_layer2/
│   ├── images/
│   │   ├── train/
│   │   │   ├── img001.jpg
│   │   │   └── ...
│   │   └── val/
│   │       └── ...
│   ├── labels/
│   │   ├── train/
│   │   │   ├── img001.txt  # x_center y_center width height
│   │   │   └── ...
│   │   └── val/
│   │       └── ...
│   └── yolo_layer2.yaml
```

### Format d'annotation (YOLO)

```
# img001.txt
0 0.5 0.3 0.2 0.4    # classe 0 (bocal_epices), coords normalisées
1 0.8 0.6 0.15 0.3   # classe 1 (emballage)
```

---

## Amélioration attendue

| Scénario | Sans Layer 2 | Avec Layer 2 |
|----------|--------------|--------------|
| Épice seule dans l'image | 90% précis | 95% précis |
| Épice + légumes mélangés | 60% précis | 90% précis |
| Bocal fermé avec étiquette | 40% précis | 85% précis |
| Plusieurs bocaux | 50% précis | 90% précis |

---

## Code préparé (à activer plus tard)

Le fichier `app_eco/yolo_layer2_detector.py` pourrait ressembler à :

```python
class YOLOLayer2Detector:
    """Détecte les zones d'épices/emballages."""

    CLASSES = ['bocal_epices', 'epice_poudre', 'emballage', 'etiquette']

    def __init__(self, model_path):
        self.model = YOLO(model_path)

    def detect_zones(self, image, conf=0.5):
        """Retourne les crops des zones détectées."""
        results = self.model.predict(image, conf=conf)

        crops = []
        for box in results[0].boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            crop = image[y1:y2, x1:x2]
            crops.append({
                'crop': crop,
                'class': self.CLASSES[int(box.cls[0])],
                'bbox': [x1, y1, x2, y2]
            })

        return crops
```

---

## Conclusion

YOLO Layer 2 est une **amélioration optionnelle** qui :
- Améliore la précision sur les images complexes
- Permet de mieux gérer les bocaux et emballages
- Nécessite un dataset spécifique à créer

**Priorité** : Basse - Le système actuel fonctionne déjà bien pour la plupart des cas d'usage.
