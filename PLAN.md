# Documentation Technique - Integration Prisma ORM, Redis Cache, IA Scanner et Systeme d'Avis

## Table des matieres

1. [Migration Prisma ORM](#1-migration-prisma-orm)
2. [Cache Redis](#2-cache-redis)
3. [Scanner IA d'ingredients](#3-scanner-ia-dingredients)
4. [Systeme d'avis](#4-systeme-davis)

---

## 1. Migration Prisma ORM

### 1.1 Contexte et objectif

Le backend utilisait initialement le module `pg` (node-postgres) avec des requetes SQL brutes via `db.query()`. La migration vers Prisma ORM a ete realisee pour :
- Beneficier d'un ORM type-safe avec auto-completion
- Simplifier les requetes CRUD (create, read, update, delete)
- Utiliser les transactions natives de Prisma
- Garder la possibilite d'executer du SQL brut pour les requetes complexes via `$queryRaw`

### 1.2 Installation et setup

**Dependances installees :**
```json
{
  "dependencies": {
    "@prisma/client": "^6.19.2"
  },
  "devDependencies": {
    "prisma": "^6.19.2"
  }
}
```

**Etapes d'installation :**
```bash
npm install prisma @prisma/client
npx prisma init
```

### 1.3 Introspection de la base existante

Plutot que de creer le schema manuellement, on a utilise l'introspection Prisma pour generer le schema a partir de la base PostgreSQL deja en place :

```bash
npx prisma db pull
npx prisma generate
```

Cette approche "brownfield" permet de :
- Conserver toutes les fonctions PostgreSQL existantes (triggers, contraintes CHECK, generation de numero de commande)
- Ne pas modifier la structure de la base
- Generer automatiquement le schema Prisma avec les bonnes relations

### 1.4 Configuration Prisma

**Fichier `prisma/schema.prisma` :**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Variable d'environnement (`.env`) :**
```
DATABASE_URL="postgresql://postgres:user@localhost:5432/ecostock_db?schema=public"
```

### 1.5 Singleton PrismaClient

**Fichier `config/prisma.js` :**
```javascript
const { PrismaClient } = require('@prisma/client');

// BigInt serialization pour les resultats $queryRaw (COUNT/SUM retournent BigInt)
BigInt.prototype.toJSON = function () {
  return Number(this);
};

// Singleton pattern - evite les connexions multiples en dev
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;
```

Points importants :
- **Singleton** : Evite l'erreur "Too many PrismaClient instances" en dev (hot reload)
- **BigInt -> Number** : Les fonctions d'agregation PostgreSQL (COUNT, SUM) retournent des BigInt, convertis en Number pour la serialisation JSON
- **Logs** : Limites aux warnings et erreurs pour eviter le bruit en dev

### 1.6 Schema complet des modeles

Le schema comprend **15 modeles** qui representent toutes les tables de la base :

| Modele | Description | Cle primaire | Relations principales |
|--------|------------|-------------|----------------------|
| `users` | Utilisateurs (clients, vendeurs, associations) | UUID | -> commerces, products, commandes, reviews, favorites, panier |
| `commerces` | Boutiques des vendeurs | UUID | -> users (1:1), reviews |
| `products` | Produits en vente | UUID | -> users, categories, product_items, favorites, panier, commande_items |
| `categories` | Categories de produits | INT auto | -> products |
| `ingredients` | Ingredients disponibles | INT auto | -> product_items, recipe_ingredients |
| `product_items` | Composition d'un produit (ingredients) | INT auto | -> products, ingredients |
| `commandes` | Commandes clients | UUID | -> users (client + vendeur), commande_items |
| `commande_items` | Lignes de commande | INT auto | -> commandes, products |
| `panier` | Panier d'achat | INT auto | -> users, products |
| `favorites` | Produits favoris | INT auto | -> users, products |
| `reviews` | Avis sur les commerces | UUID | -> users, commerces |
| `recipes` | Recettes de cuisine | INT auto | -> recipe_categories, recipe_ingredients |
| `recipe_categories` | Categories de recettes | INT auto | -> recipes |
| `recipe_ingredients` | Ingredients des recettes (table pivot) | Composite | -> recipes, ingredients |

### 1.7 Exemples de migration des requetes

#### A. Requetes simples -> Prisma ORM natif

**Avant (pg) :**
```javascript
const result = await db.query(
  'SELECT id, nom, description FROM categories ORDER BY nom',
);
const categories = result.rows;
```

**Apres (Prisma) :**
```javascript
const categories = await prisma.categories.findMany({
  select: { id: true, nom: true, description: true },
  orderBy: { nom: 'asc' },
});
```

#### B. Transactions -> `prisma.$transaction()`

**Avant (pg) :**
```javascript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const userResult = await client.query('INSERT INTO users...');
  const commerceResult = await client.query('INSERT INTO commerces...');
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
} finally {
  client.release();
}
```

**Apres (Prisma) :**
```javascript
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.users.create({
    data: { prenom, nom, email, password: hashedPassword, user_type },
    select: { id: true, prenom: true, nom: true, email: true },
  });

  if (user_type === 'vendeur') {
    await tx.commerces.create({
      data: { vendeur_id: user.id, nom_commerce, adresse, latitude, longitude },
    });
  }

  return { user };
});
```

#### C. Upsert natif

**Avant (pg) :**
```javascript
const existing = await db.query('SELECT id FROM reviews WHERE user_id = $1 AND commerce_id = $2', [userId, commerceId]);
if (existing.rows.length > 0) {
  await db.query('UPDATE reviews SET note = $1, commentaire = $2 WHERE id = $3', [note, commentaire, existing.rows[0].id]);
} else {
  await db.query('INSERT INTO reviews (user_id, commerce_id, note, commentaire) VALUES ($1, $2, $3, $4)', [userId, commerceId, note, commentaire]);
}
```

**Apres (Prisma) :**
```javascript
const review = await prisma.reviews.upsert({
  where: {
    reviews_unique_user_commerce: { user_id: userId, commerce_id },
  },
  update: { note, commentaire: commentaire || null, updated_at: new Date() },
  create: { user_id: userId, commerce_id, note, commentaire: commentaire || null },
});
```

#### D. Requetes complexes -> `$queryRaw` / `$queryRawUnsafe`

Certaines requetes restent en SQL brut car elles utilisent des fonctionnalites avancees de PostgreSQL impossibles a exprimer en Prisma natif :

- **Recherche avec scoring** : `CASE WHEN LOWER(p.nom) = LOWER($1) THEN 100 ...`
- **Calcul de distance Haversine** : `6371 * acos(cos(radians($2)) * cos(radians(c.latitude)) * ...)`
- **Agregations avancees** : `STRING_AGG(DISTINCT i.name, ', ')`, `ARRAY_AGG(...) FILTER (...)`
- **Statuts dynamiques** : `CASE WHEN p.dlc < CURRENT_DATE THEN 'expired' ...`
- **Mise a jour conditionnelle** : `SET stock = GREATEST(stock - $1, 0)`

Exemple - Recherche produits avec scoring :
```javascript
const products = await prisma.$queryRawUnsafe(
  `SELECT p.id, p.nom, p.prix,
    CASE
      WHEN LOWER(p.nom) = LOWER($1) THEN 100
      WHEN LOWER(p.nom) LIKE LOWER($1) || '%' THEN 90
      WHEN LOWER(p.nom) LIKE '%' || LOWER($1) || '%' THEN 70
      ELSE 50
    END as score
  FROM products p
  WHERE p.is_disponible = true AND p.stock > 0
  ORDER BY score DESC
  LIMIT $2 OFFSET $3`,
  searchQuery, limit, offset
);
```

### 1.8 Routes migrees

| Route | Fichier | Methode Prisma | Requetes brutes |
|-------|---------|---------------|-----------------|
| Auth | `routes/auth.js` | findUnique, create, update, $transaction | 0 |
| Profile | `routes/profile.js` | findUnique, update, create | 0 |
| Seller | `routes/seller.js` | findMany, create, update, delete, findFirst | 2 ($queryRawUnsafe) |
| Products | `routes/products.js` | - | 3 ($queryRawUnsafe) |
| Recipes | `routes/recipes.js` | findMany | 2 ($queryRaw) |
| Reviews | `routes/reviews.js` | upsert, findMany, aggregate, findFirst, delete, findUnique | 0 |
| Payment | `routes/payment.js` | findMany, create, updateMany, deleteMany, $transaction | 2 ($queryRaw) |
| Ingredients | `routes/ingredients.js` | - | 1 ($queryRawUnsafe) |
| Middleware auth | `middleware/auth.js` | findFirst | 0 |

---

## 2. Cache Redis

### 2.1 Contexte et objectif

Redis a ete integre comme couche de cache optionnelle pour ameliorer les performances sur les donnees frequemment lues et rarement modifiees. L'application fonctionne normalement sans Redis (degradation gracieuse).

### 2.2 Installation et configuration

**Dependance :**
```json
{
  "dependencies": {
    "ioredis": "^5.9.2"
  }
}
```

**Variable d'environnement (`.env`) :**
```
REDIS_URL="redis://localhost:6379"
```

### 2.3 Configuration Redis (`config/redis.js`)

```javascript
const Redis = require('ioredis');

let redis = null;
let isConnected = false;

try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        console.log('[Redis] Arret des tentatives de reconnexion');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redis.on('connect', () => {
    isConnected = true;
    console.log('[Redis] Connecte');
  });

  redis.on('error', (err) => {
    if (isConnected) {
      console.log('[Redis] Deconnecte - le cache est desactive');
    }
    isConnected = false;
  });

  redis.on('close', () => {
    isConnected = false;
  });

  redis.connect().catch(() => {
    console.log('[Redis] Non disponible - l\'app fonctionne sans cache');
  });
} catch (error) {
  console.log('[Redis] Non disponible - l\'app fonctionne sans cache');
}

module.exports = { redis, isConnected: () => isConnected };
```

Points cles :
- **`lazyConnect: true`** : Connexion non bloquante au demarrage, le serveur Node demarre meme si Redis est absent
- **Retry strategy** : Max 3 tentatives avec backoff exponentiel (200ms, 400ms, 2000ms), puis abandon
- **Monitoring** : Evenements `connect`, `error`, `close` pour suivre l'etat de la connexion

### 2.4 Utilitaires de cache (`utils/cache.js`)

Trois fonctions principales :

```javascript
const { redis, isConnected } = require('../config/redis');

// Lire une valeur du cache
async function getCache(key) {
  if (!isConnected()) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// Ecrire une valeur dans le cache
async function setCache(key, data, ttl = 300) {
  if (!isConnected()) return;
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } catch {
    // Silencieux - le cache est optionnel
  }
}

// Supprimer une ou plusieurs cles (supporte les patterns avec *)
async function invalidateCache(pattern) {
  if (!isConnected()) return;
  try {
    if (pattern.includes('*')) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      await redis.del(pattern);
    }
  } catch {
    // Silencieux
  }
}

module.exports = { getCache, setCache, invalidateCache };
```

Design : toutes les fonctions echouent silencieusement si Redis est indisponible, l'application continue de fonctionner en lisant directement la base de donnees.

### 2.5 Endpoints caches et TTL

| Donnee | Cle Redis | TTL | Route | Invalidation |
|--------|-----------|-----|-------|-------------|
| Liste des categories | `categories:all` | 1h (3600s) | `GET /api/seller/categories` | Jamais (statique) |
| Recettes (pagination) | `recipes:page:{limit}:{offset}` | 10min (600s) | `GET /api/recipes` | - |
| Recette individuelle | `recipe:{id}` | 30min (1800s) | `GET /api/recipes/:id` | - |
| Recherche ingredients | `ingredients:search:{query}` | 15min (900s) | `GET /api/recipes/ingredients/search` | - |
| Stats avis commerce | `commerce:stats:{commerceId}` | 5min (300s) | `GET /api/reviews/commerce/:id` | Apres creation/suppression d'un avis |

### 2.6 Strategie d'invalidation

Le cache est invalide a chaque modification de donnees concernees :

```javascript
// Apres ajout/modification/suppression d'un produit
await invalidateCache('products:*');

// Apres creation ou suppression d'un avis
await invalidateCache(`commerce:stats:${commerce_id}`);
```

L'invalidation utilise des patterns (wildcard `*`) pour les donnees paginables et des cles exactes pour les donnees specifiques.

### 2.7 Exemple d'utilisation dans une route

```javascript
const { getCache, setCache } = require('../utils/cache');

router.get('/categories', authenticateToken, async (req, res) => {
  // 1. Verifier le cache
  const cached = await getCache('categories:all');
  if (cached) {
    return res.json({ success: true, categories: cached });
  }

  // 2. Si pas en cache, lire en base
  const categories = await prisma.categories.findMany({
    select: { id: true, nom: true, description: true },
    orderBy: { nom: 'asc' },
  });

  // 3. Stocker en cache pour 1 heure
  await setCache('categories:all', categories, 3600);

  res.json({ success: true, categories });
});
```

---

## 3. Scanner IA d'ingredients

### 3.1 Architecture globale

Le scanner IA est un **serveur Python Flask separe** qui tourne sur le port 5001. Le backend Node.js agit comme proxy et relaie les requetes vers ce serveur.

```
[App Mobile] --> [Backend Node.js :3000] --> [Serveur IA Python :5001]
                     (proxy)                     (YOLO + CNN + OCR)
```

### 3.2 Module `app_eco` - Structure

Le moteur IA est organise en module Python reutilisable :

```
ecostock_backend/app_eco/
  __init__.py              # Point d'entree du module
  ingredient_detector.py   # Detecteur principal (orchestrateur)
  yolo_detector.py         # Detection d'objets YOLO
  cnn_classifier.py        # Classification CNN (epices) + detection OOD
  ocr_reader.py            # Lecture de texte OCR sur emballages
  fusion.py                # Moteur de fusion multi-sources
  train_cnn.py             # Script d'entrainement du CNN
  models/                  # Modeles entraines
    yolo_layer1.pt         # Modele YOLO entraine
    cnn_spices.pt          # Modele CNN entraine
```

### 3.3 Couche 1 : Detection YOLO (`yolo_detector.py`)

**Role** : Detecter les objets/ingredients visibles dans l'image (fruits, legumes, viandes).

**Technologie** : YOLOv8 via la librairie `ultralytics`

**Fonctionnement** :
```python
class YOLODetector:
    def __init__(self, model_path, device='auto'):
        from ultralytics import YOLO
        self.model = YOLO(model_path)
        self.classes = list(self.model.names.values())  # Classes du modele

    def detect(self, image, conf=0.5):
        results = self.model.predict(image, conf=conf, verbose=False)
        detections = []
        for result in results:
            for box in result.boxes:
                detections.append({
                    'name': self.classes[int(box.cls[0])],
                    'confidence': float(box.conf[0]),
                    'bbox': box.xyxy[0].tolist(),
                    'source': 'yolo'
                })
        return detections
```

**Ingredients detectes** : tomate, oignon, ail, carotte, pomme de terre, oeuf, poulet, etc. (classes du modele YOLO entraine).

**Support GPU** : Detection automatique CUDA, fallback sur CPU.

### 3.4 Couche 2 : Classification CNN (`cnn_classifier.py`)

**Role** : Classifier les epices et condiments que YOLO ne detecte pas bien.

**Technologie** : ResNet-18 (PyTorch) avec detection Out-of-Distribution (OOD)

**Fonctionnement** :
```python
class CNNClassifier:
    def __init__(self, model_path, device='auto'):
        checkpoint = torch.load(model_path, map_location=device)
        self.classes = checkpoint['classes']        # Ex: ['paprika', 'poivre']
        self.prototypes = checkpoint['prototypes']  # Centroides de classe
        self.radii = checkpoint['radii']            # Rayons de decision

        self.model = models.resnet18(weights=None)
        self.model.fc = nn.Linear(num_features, len(self.classes))
        self.model.load_state_dict(checkpoint['model_state_dict'])
```

**Detection OOD (Out-of-Distribution)** :
Le CNN utilise des prototypes (centroides dans l'espace de features) pour rejeter les images qui ne ressemblent pas aux epices connues. Cela evite les faux positifs quand on lui montre une image de tomate par exemple.

```python
def _is_in_distribution(self, features, margin=1.0):
    for class_id, prototype in self.prototypes.items():
        distance = np.linalg.norm(features - prototype)
        ratio = distance / self.radii[class_id]
    return min_ratio < margin  # True si l'image est reconnue
```

- `margin < 1.0` : Tres strict, rejette beaucoup
- `margin > 1.5` : Permissif, accepte plus d'images

### 3.5 Couche 3 : OCR (`ocr_reader.py`)

**Role** : Lire le texte sur les emballages alimentaires et identifier les ingredients.

**Technologie** : EasyOCR avec support francais et anglais

**Fonctionnement** :
1. EasyOCR extrait le texte brut de l'image
2. Le texte est compare a un dictionnaire de 80+ ingredients dans 4 langues (FR, EN, IT, ES)
3. Chaque mot-cle trouve correspond a un ingredient

**Dictionnaire multilingue** : Le `KEYWORD_MAPPING` contient les traductions de chaque ingredient :
```python
KEYWORD_MAPPING = {
    'tomate': ['tomate', 'tomato', 'pomodoro', 'tomate cerise', ...],
    'oignon': ['oignon', 'onion', 'cipolla', 'cebolla', ...],
    'poulet': ['poulet', 'chicken', 'pollo', 'volaille', ...],
    # ... 80+ ingredients couvrant legumes, fruits, proteines,
    #     produits laitiers, epices, feculents, legumineuses,
    #     condiments, noix et graines
}
```

**Categories couvertes** :
- Legumes (21 ingredients)
- Fruits (17 ingredients)
- Proteines (16 ingredients)
- Produits laitiers (8 ingredients)
- Epices et aromates (30 ingredients)
- Feculents et cereales (10 ingredients)
- Legumineuses (6 ingredients)
- Condiments et sauces (9 ingredients)
- Noix et graines (8 ingredients)

### 3.6 Moteur de Fusion (`fusion.py`)

**Role** : Combiner intelligemment les resultats des 3 couches pour eviter les doublons et prioriser par confiance.

**Logique de fusion** :
1. **YOLO haute confiance (>0.9)** : Ingredient confirme directement
2. **YOLO confiance moyenne (0.5-0.9)** : Verifie avec OCR si possible
3. **CNN** : Ajoute les epices detectees si confiance > seuil
4. **OCR** : Ajoute les ingredients trouves dans le texte
5. **Bonus multi-source** : +5% par source supplementaire si un ingredient est detecte par 2+ sources

```python
class FusionEngine:
    def fuse(self, yolo_results, cnn_results, ocr_results):
        ingredient_scores = {}

        # Traiter YOLO, CNN, OCR
        for det in yolo_results:
            ingredient_scores[det['name']] = {'confidence': det['confidence'], 'sources': ['yolo']}

        # Bonus multi-source
        for name, data in ingredient_scores.items():
            if len(data['sources']) >= 2:
                data['confidence'] = min(1.0, data['confidence'] + 0.05 * len(data['sources']))

        return {
            'ingredients': sorted(ingredient_scores.keys(), key=lambda x: ingredient_scores[x]['confidence'], reverse=True),
            'confidence_scores': ingredient_scores
        }
```

### 3.7 Serveur Flask (`ai_server.py`)

**Point d'entree du serveur IA :**

```python
from flask import Flask, request, jsonify
from app_eco import IngredientDetector

app = Flask(__name__)
detector = IngredientDetector()  # Charge les modeles au demarrage

@app.route('/api/ai/detect', methods=['POST'])
def detect_ingredients():
    image_base64 = request.json['image']
    image = Image.open(io.BytesIO(base64.b64decode(image_base64)))

    results = detector.detect(image, yolo_conf=0.4, cnn_conf=0.5, ocr_conf=0.3, ood_margin=1.5)

    ingredients = [{'name': name, 'confidence': round(conf * 100)} for name, conf in ...]
    return jsonify({'success': True, 'ingredients': ingredients, 'count': len(ingredients)})

@app.route('/api/ai/health', methods=['GET'])
def health():
    return jsonify({'success': True, 'status': 'ok'})

app.run(host='0.0.0.0', port=5001)
```

**Seuils de detection utilises :**
| Couche | Seuil | Signification |
|--------|-------|--------------|
| YOLO | 0.4 | Seuil bas pour maximiser la detection |
| CNN | 0.5 | Seuil moyen pour les epices |
| OCR | 0.3 | Seuil bas car le texte OCR est plus fiable quand detecte |
| OOD margin | 1.5 | Permissif - accepte plus d'images pour le CNN |

### 3.8 Proxy Node.js (`server.js`)

Le backend Node.js relaie les requetes vers le serveur Python :

```javascript
// PROXY AI - Relaie vers le serveur Python (port 5001)
app.post('/api/ai/detect', async (req, res) => {
  try {
    const response = await fetch('http://localhost:5001/api/ai/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Serveur IA non disponible. Lancez: python ai_server.py'
    });
  }
});
```

### 3.9 Integration Frontend (`IngredientScannerScreen.tsx`)

L'ecran de scan dans l'application mobile :

1. L'utilisateur prend une photo ou choisit depuis la galerie
2. L'image est convertie en base64 et envoyee a l'API
3. Les ingredients detectes sont affiches sous forme de chips selectionnables
4. L'utilisateur selectionne les ingredients souhaites
5. Clic sur "Trouver des recettes" pour chercher des recettes correspondantes

```typescript
const analyzeImage = async (base64: string) => {
  const response = await API.detectIngredients(base64);
  if (response.success && response.ingredients.length > 0) {
    const detected = response.ingredients.map(ing => ({
      name: ing.name,
      confidence: ing.confidence,
      selected: true,
    }));
    setIngredients(detected);
  }
};
```

### 3.10 Recherche intelligente d'ingredients (fuzzy matching)

En complement du scanner IA, le systeme offre une recherche intelligente d'ingredients par texte dans l'ecran d'ajout de produit (`AddProductScreen`).

**Fichier `utils/fuzzyMatch.js` :**

Le fuzzy matching utilise la **distance de Levenshtein** pour trouver des correspondances meme avec des fautes de frappe :

```javascript
function findBestMatches(input, ingredients, threshold = 0.6, maxResults = 5) {
  const normalizedInput = normalize(input);

  const matches = ingredients.map(ingredient => {
    const normalizedName = normalize(ingredient.name);
    let score = 0;

    if (normalizedName === normalizedInput) score = 1.0;           // Match exact
    else if (normalizedName.startsWith(normalizedInput)) score = 0.9; // Commence par
    else if (normalizedName.includes(normalizedInput)) score = 0.8;   // Contient
    else score = similarityScore(normalizedInput, normalizedName);     // Levenshtein

    return { ...ingredient, score, normalized: normalizedName };
  });

  return matches
    .filter(match => match.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}
```

**Normalisation** : Les chaines sont normalisees (minuscules, sans accents, sans caracteres speciaux) avant comparaison pour maximiser les correspondances.

**Endpoint** : `GET /api/seller/ingredients/search?query=tom` renvoie les ingredients correspondants avec un score de pertinence.

### 3.11 Dependances Python

```
flask
flask-cors
Pillow
ultralytics      # YOLOv8
torch
torchvision
easyocr          # OCR
opencv-python    # Traitement d'images
numpy
```

---

## 4. Systeme d'avis

### 4.1 Contexte et objectif

Le systeme d'avis permet aux clients de noter les commerces apres un achat. Chaque utilisateur peut laisser un seul avis par commerce (upsert : mise a jour si deja note).

### 4.2 Schema de la base de donnees

**Table `reviews` (Prisma) :**
```prisma
model reviews {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id     String    @db.Uuid
  commerce_id String    @db.Uuid
  note        Int                          // Note de 1 a 5
  commentaire String?                      // Commentaire optionnel
  created_at  DateTime? @default(now())
  updated_at  DateTime? @default(now())
  commerces   commerces @relation(...)     // FK vers commerces
  users       users     @relation(...)     // FK vers users

  @@unique([user_id, commerce_id], map: "reviews_unique_user_commerce")
  @@index([commerce_id])
  @@index([user_id])
}
```

**Contraintes** :
- Contrainte unique `[user_id, commerce_id]` : un seul avis par utilisateur par commerce
- Contrainte CHECK (PostgreSQL) : `note` entre 1 et 5
- Suppression en cascade si l'utilisateur ou le commerce est supprime

### 4.3 API Backend (`routes/reviews.js`)

Le fichier expose 6 endpoints, tous proteges par `authenticateToken` :

#### POST `/api/reviews` - Creer ou mettre a jour un avis

```javascript
router.post('/', authenticateToken, async (req, res) => {
  const { commerce_id, note, commentaire } = req.body;

  // Validations
  if (note < 1 || note > 5) return res.status(400)...
  if (commerce.vendeur_id === userId) return res.status(403)... // Pas son propre commerce

  // Upsert : insere ou met a jour
  const review = await prisma.reviews.upsert({
    where: { reviews_unique_user_commerce: { user_id: userId, commerce_id } },
    update: { note, commentaire, updated_at: new Date() },
    create: { user_id: userId, commerce_id, note, commentaire },
  });

  // Invalider le cache des stats
  await invalidateCache(`commerce:stats:${commerce_id}`);
});
```

#### GET `/api/reviews/commerce/:commerceId` - Avis d'un commerce + stats

```javascript
router.get('/commerce/:commerceId', authenticateToken, async (req, res) => {
  // Stats depuis le cache (5 min TTL)
  const cachedStats = await getCache(`commerce:stats:${commerceId}`);

  // Liste des avis avec infos utilisateur
  const reviews = await prisma.reviews.findMany({
    where: { commerce_id: commerceId },
    include: {
      users: { select: { prenom: true, nom: true, photo_profil: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  // Calcul des stats si pas en cache
  if (!cachedStats) {
    const aggregate = await prisma.reviews.aggregate({
      where: { commerce_id: commerceId },
      _count: true,
      _avg: { note: true },
    });
    stats = {
      total_reviews: aggregate._count,
      average_rating: parseFloat(aggregate._avg.note.toFixed(1)),
    };
    await setCache(`commerce:stats:${commerceId}`, stats, 300);
  }

  res.json({ success: true, reviews: formattedReviews, stats });
});
```

#### GET `/api/reviews/my-reviews` - Mes avis

Retourne tous les avis laisses par l'utilisateur connecte avec les informations du commerce :
```javascript
const reviews = await prisma.reviews.findMany({
  where: { user_id: userId },
  include: {
    commerces: { select: { id: true, nom_commerce: true, adresse: true } },
  },
  orderBy: { created_at: 'desc' },
});
```

#### GET `/api/reviews/shop-reviews` - Avis de ma boutique (vendeur)

Accessible uniquement aux vendeurs. Retourne les avis sur leur commerce + stats :
```javascript
if (req.user.user_type !== 'vendeur') return res.status(403)...

const commerce = await prisma.commerces.findUnique({ where: { vendeur_id: vendeurId } });
const reviews = await prisma.reviews.findMany({ where: { commerce_id: commerce.id }, ... });
const aggregate = await prisma.reviews.aggregate({ where: { commerce_id: commerce.id }, _count: true, _avg: { note: true } });
```

#### DELETE `/api/reviews/:reviewId` - Supprimer un avis

Seul l'auteur peut supprimer son avis :
```javascript
const review = await prisma.reviews.findFirst({
  where: { id: reviewId, user_id: userId },
});
if (!review) return res.status(404)...

await prisma.reviews.delete({ where: { id: reviewId } });
await invalidateCache(`commerce:stats:${review.commerce_id}`);
```

#### GET `/api/reviews/check/:commerceId` - Verifier si deja note

```javascript
const review = await prisma.reviews.findUnique({
  where: {
    reviews_unique_user_commerce: { user_id: userId, commerce_id: commerceId },
  },
  select: { id: true, note: true, commentaire: true },
});

res.json({ success: true, hasReview: !!review, review: review || null });
```

### 4.4 Integration avec le cache Redis

Les statistiques des avis (moyenne et nombre) sont cachees pour eviter de recalculer l'aggregation a chaque requete :

- **Cle** : `commerce:stats:{commerceId}`
- **TTL** : 300 secondes (5 minutes)
- **Invalidation** : Automatique apres chaque creation, modification ou suppression d'avis

### 4.5 Regles metier

| Regle | Implementation |
|-------|---------------|
| Note entre 1 et 5 | Validation backend + contrainte CHECK PostgreSQL |
| Un seul avis par commerce par utilisateur | Contrainte UNIQUE + upsert Prisma |
| Impossible de noter son propre commerce | Verification `commerce.vendeur_id === userId` |
| Seul l'auteur peut supprimer son avis | Verification `review.user_id === userId` |
| Le commentaire est optionnel | Champ `commentaire` nullable |

### 4.6 Calcul de la note moyenne

La note moyenne est calculee via `prisma.reviews.aggregate()` et est affichee sur la page du commerce :
```javascript
const aggregate = await prisma.reviews.aggregate({
  where: { commerce_id: commerceId },
  _count: true,
  _avg: { note: true },
});

const stats = {
  total_reviews: aggregate._count || 0,
  average_rating: aggregate._avg.note
    ? Number.parseFloat(aggregate._avg.note.toFixed(1))
    : 0,
};
```

### 4.7 Enregistrement dans le serveur

La route reviews est enregistree dans `server.js` :
```javascript
const reviewsRoutes = require('./routes/reviews');
app.use('/api/reviews', reviewsRoutes);
```

---

## Resume des fichiers cles

### Prisma ORM
| Fichier | Role |
|---------|------|
| `prisma/schema.prisma` | Schema de la base de donnees (15 modeles) |
| `config/prisma.js` | Singleton PrismaClient |
| `.env` | DATABASE_URL |

### Cache Redis
| Fichier | Role |
|---------|------|
| `config/redis.js` | Configuration et connexion Redis |
| `utils/cache.js` | Fonctions getCache, setCache, invalidateCache |
| `.env` | REDIS_URL |

### Scanner IA
| Fichier | Role |
|---------|------|
| `ai_server.py` | Serveur Flask (port 5001) |
| `app_eco/__init__.py` | Point d'entree du module |
| `app_eco/ingredient_detector.py` | Orchestrateur YOLO + CNN + OCR |
| `app_eco/yolo_detector.py` | Detection d'objets YOLOv8 |
| `app_eco/cnn_classifier.py` | Classification CNN + detection OOD |
| `app_eco/ocr_reader.py` | Lecture de texte OCR (80+ ingredients, 4 langues) |
| `app_eco/fusion.py` | Moteur de fusion multi-sources |
| `app_eco/models/` | Modeles entraines (.pt) |
| `utils/fuzzyMatch.js` | Recherche intelligente par distance de Levenshtein |
| `server.js` | Proxy AI (lignes 58-85) |

### Systeme d'avis
| Fichier | Role |
|---------|------|
| `routes/reviews.js` | 6 endpoints CRUD pour les avis |
| `prisma/schema.prisma` | Modele reviews |
| `server.js` | Enregistrement de la route `/api/reviews` |
