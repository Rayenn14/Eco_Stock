# Architecture du Système Multi-Couches

## Vue d'ensemble

Le système de détection d'ingrédients utilise une **architecture multi-couches** où chaque couche est spécialisée dans un type de détection différent.

```
┌─────────────────────────────────────────────────────────────┐
│                        IMAGE INPUT                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    COUCHE 1 : YOLO                          │
│         Détection d'objets (ingrédients visibles)           │
│   tomate, oignon, ail, carotte, pomme_de_terre, oeuf, poulet│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    COUCHE 2 : CNN                           │
│            Classification d'épices                          │
│                   paprika, poivre                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    COUCHE 3 : OCR                           │
│         Lecture de texte sur emballages                     │
│     Détecte mots-clés : "tomate", "pepper", etc.           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    COUCHE FUSION                            │
│     Combine les résultats + calcule confiance finale        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   LISTE INGREDIENTS                         │
│        ['tomate', 'oignon', 'paprika', 'poulet']           │
└─────────────────────────────────────────────────────────────┘
```

## Pourquoi Multi-Couches ?

### Problème avec une seule approche

| Approche unique | Limitation |
|-----------------|------------|
| YOLO seul | Ne peut pas lire le texte sur les emballages |
| CNN seul | Ne peut pas localiser les objets dans l'image |
| OCR seul | Ne fonctionne que s'il y a du texte visible |

### Solution Multi-Couches

Chaque couche compense les faiblesses des autres :

- **YOLO** : Excellent pour détecter des objets visibles (tomate entière, poulet)
- **CNN** : Excellent pour classifier des textures/couleurs (poudres d'épices)
- **OCR** : Excellent pour lire les emballages (boîte de conserve, sachet)

## Flux de Données Détaillé

```
1. IMAGE ENTRÉE
   └── photo de cuisine (ex: 1920x1080 pixels)

2. YOLO DETECTION
   ├── Input: Image complète
   ├── Process: Détection d'objets avec bounding boxes
   └── Output: [
         {name: "tomate", confidence: 0.95, bbox: [100,200,300,400]},
         {name: "poulet", confidence: 0.87, bbox: [500,100,800,400]}
       ]

3. CNN CLASSIFICATION
   ├── Input: Image complète (ou crops si YOLO Layer 2 actif)
   ├── Process: Classification dans les catégories d'épices
   └── Output: [
         {name: "paprika", confidence: 0.82}
       ]

4. OCR LECTURE
   ├── Input: Image complète
   ├── Process: Extraction texte + matching mots-clés
   └── Output: [
         {name: "sel", matched_keyword: "salt"}
       ]

5. FUSION
   ├── Input: Résultats des 3 couches
   ├── Process:
   │   - Dédoublonnage
   │   - Calcul confiance combinée
   │   - Boost si multi-source
   └── Output: {
         ingredients: ["tomate", "poulet", "paprika", "sel"],
         confidence_scores: {...}
       }
```

## Avantages de cette Architecture

1. **Robustesse** : Si une couche échoue, les autres compensent
2. **Précision** : Confirmation multi-source = plus fiable
3. **Flexibilité** : Chaque couche peut être améliorée indépendamment
4. **Extensibilité** : Facile d'ajouter de nouvelles couches
