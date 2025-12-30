# Eco Stock - Guide de développement Claude

## 📋 Vue d'ensemble du projet

**Eco Stock** est une application mobile React Native (Expo) avec backend Node.js/Express et PostgreSQL pour réduire le gaspillage alimentaire. Les vendeurs peuvent vendre des produits proches de la DLC à prix réduit, et les acheteurs peuvent trouver des recettes basées sur leurs achats.

## 🏗️ Architecture

### Frontend (React Native + TypeScript + Expo)
- **Navigation**: React Navigation avec tabs + stacks
- **État global**: Context API (CartContext)
- **Persistance**: AsyncStorage
- **Localisation**: react-native-maps
- **Upload images**: Cloudinary

### Backend (Node.js + Express)
- **Base de données**: PostgreSQL
- **Auth**: JWT tokens
- **Upload**: Multer + Cloudinary
- **Routes**: `/api/auth`, `/api/products`, `/api/seller`, `/api/recipes`, `/api/ingredients`

### Base de données PostgreSQL
- **Tables principales**: `users`, `products`, `commerces`, `categories`, `ingredients`, `recipes`
- **Relations**:
  - `product_items` (many-to-many entre products et ingredients)
  - `recipe_ingredients` (many-to-many entre recipes et ingredients)
  - `recipe_categories` (table normalisée pour catégories de recettes)

## 🗂️ Structure des dossiers

```
Eco_Stock/
├── Eco_Front/                      # Application React Native
│   ├── src/
│   │   ├── screens/                # Écrans de l'app
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── ProductDetailScreen.tsx
│   │   │   ├── CartScreen.tsx
│   │   │   ├── RecipesScreen.tsx
│   │   │   ├── RecipeDetailScreen.tsx
│   │   │   ├── AddProductScreen.tsx
│   │   │   └── ProfileScreen.tsx
│   │   ├── navigation/             # Configuration navigation
│   │   │   ├── RootNavigator.tsx
│   │   │   ├── MainTabNavigator.tsx
│   │   │   ├── HomeNavigator.tsx
│   │   │   └── ProfileNavigator.tsx
│   │   ├── contexts/               # Context API
│   │   │   └── CartContext.tsx    # Gestion panier
│   │   ├── services/
│   │   │   └── api.ts             # Fonctions API
│   │   └── components/
│   └── assets/
├── ecostock_backend/              # Backend Node.js
│   ├── routes/
│   │   ├── auth.js               # Authentification
│   │   ├── products.js           # Produits
│   │   ├── seller.js             # Vendeur
│   │   ├── recipes.js            # Recettes
│   │   └── ingredients.js        # Ingrédients
│   ├── middleware/
│   │   └── auth.js               # JWT middleware
│   ├── config/
│   │   ├── database.js           # Connexion PostgreSQL
│   │   └── cloudinary.js         # Config Cloudinary
│   └── server.js                 # Point d'entrée
└── ecostock_db.sql               # Schema PostgreSQL
```

## 🔑 Fonctionnalités principales

### 1. Système de panier
- **Fichier**: `Eco_Front/src/contexts/CartContext.tsx`
- Persistance avec AsyncStorage
- Ajout/suppression de produits
- Calcul du total
- Navigation vers détails produit

### 2. Système de recettes
**Frontend**:
- `RecipesScreen.tsx`: Liste de recettes avec recherche et filtres
- `RecipeDetailScreen.tsx`: Détails avec ingrédients cliquables

**Backend**:
- `routes/recipes.js`:
  - `GET /recipes` - Liste aléatoire avec pagination
  - `GET /recipes/search?query=X&category=Y` - Recherche par nom/ingrédient/catégorie
  - `GET /recipes/by-ingredients?ingredients=X,Y,Z` - Recherche par liste d'ingrédients
  - `GET /recipes/:id` - Détail d'une recette

**Fonctionnalités clés**:
- ✅ Recherche par nom de recette
- ✅ Recherche par ingrédient unique
- ✅ Recherche multi-ingrédients
- ✅ Filtres par catégorie (vegan, bio, sans gluten, etc.)
- ✅ Ingrédients cliquables avec couleurs (vert = dispo, rouge = non dispo)
- ✅ Navigation vers produit le plus proche contenant l'ingrédient
- ✅ Proposition de recettes basée sur le panier

### 3. Recherche de recettes depuis le panier
**Flow complet**:
1. Utilisateur clique "Proposer des recettes avec votre panier" (`CartScreen.tsx`)
2. Pour chaque produit du panier, récupération via `API.getProductById()`
3. Extraction des ingrédients depuis `product.ingredient_nom` (format: "tomate, oignon, ail")
4. Déduplification des ingrédients
5. Navigation vers `RecipesScreen` avec `initialSearchIngredients`
6. `RecipesScreen` affiche les ingrédients comme chips vertes
7. Recherche automatique via `API.getRecipesByIngredients()`

**Code clé** (`CartScreen.tsx:41-96`):
```typescript
const handleSuggestRecipes = async () => {
  const ingredientNames: string[] = [];

  for (const productId of productIds) {
    const response = await API.getProductById(productId);
    if (response.product?.ingredient_nom) {
      const ingredients = response.product.ingredient_nom
        .split(',')
        .map(ing => ing.trim().toLowerCase());
      ingredients.forEach(ing => {
        if (ing && !ingredientNames.includes(ing)) {
          ingredientNames.push(ing);
        }
      });
    }
  }

  navigation.navigate('Recipes', { initialSearchIngredients: ingredientNames });
};
```

### 4. Navigation vers produits depuis ingrédients
**Backend** (`routes/ingredients.js`):
```javascript
GET /ingredients/products/:ingredientName?latitude=X&longitude=Y
```
- JOIN avec `product_items` pour trouver produits contenant l'ingrédient
- Tri par distance (si géoloc) ou par prix
- Retourne max 20 produits

**Frontend** (`RecipeDetailScreen.tsx`):
- Vérification automatique de disponibilité de chaque ingrédient
- Couleurs différentes: vert (dispo) / rouge (non dispo)
- Clic → navigation vers produit le plus proche/moins cher

## 🔧 Configuration

### Variables d'environnement (.env)
```env
# Backend
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/ecostock_db
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Frontend
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api
```

### Démarrage rapide
```bash
# Backend
cd ecostock_backend
npm install
npm start

# Frontend
cd Eco_Front
npm install
npm start
```

## 🐛 Problèmes résolus

### 1. Recherche produits ne fonctionnait pas
**Problème**: Fonction `SIMILARITY()` PostgreSQL non disponible (extension pg_trgm manquante)
**Solution**: Remplacé par système de scoring avec `CASE` et `LIKE`:
- 100 points: match exact
- 90 points: commence par
- 70 points: contient
- Idem pour ingrédients

### 2. Clés en double dans FlatList recettes
**Problème**: `GROUP BY r.id, rc.nom` créait doublons quand `rc.nom` = NULL
**Solution**: Changé en `GROUP BY r.id, rc.id, rc.nom`

### 3. Ingrédients du panier pas affichés dans RecipesScreen
**Problème**: `initialSearchIngredients` passé mais pas mis dans `selectedIngredients`
**Solution**: Ajout de `setSelectedIngredients(ingredientNames)` dans `searchByCartIngredients()`

### 4. Navigation manquante dans RecipesScreen
**Problème**: Erreur "property navigation doesn't exist"
**Solution**: Ajout de `const navigation = useNavigation<any>();`

## 📊 Schéma base de données (tables clés)

### products
- id, nom, description, prix, prix_original
- dlc, stock, is_disponible, vendeur_id
- category_id, image_url

### product_items (many-to-many)
- product_id → products
- ingredient_id → ingredients

### recipes
- id, title, instructions, image_name
- recipe_category_id → recipe_categories

### recipe_ingredients (many-to-many)
- recipe_id → recipes
- ingredient_id → ingredients

### recipe_categories (normalisée)
- id, nom (vegetarien, vegan, sans_gluten, bio, traditionnel)

### ingredients
- id, name

## 🎯 Patterns importants

### 1. Recherche fuzzy avec scoring SQL
```sql
CASE
  WHEN LOWER(r.title) = LOWER($1) THEN 100
  WHEN LOWER(r.title) LIKE LOWER($1) || '%' THEN 90
  WHEN LOWER(r.title) LIKE '%' || LOWER($1) || '%' THEN 70
  ELSE 50
END as score
```

### 2. Agrégation d'ingrédients
```sql
ARRAY_AGG(DISTINCT i.name ORDER BY i.name) FILTER (WHERE i.id IS NOT NULL) as ingredients
```

### 3. Recherche multi-ingrédients avec comptage
```sql
COUNT(DISTINCT CASE
  WHEN LOWER(i.name) = ANY($1::text[]) THEN i.id
END) as matching_ingredients
```

### 4. Calcul de distance géographique
```sql
(6371 * acos(cos(radians($2)) * cos(radians(c.latitude)) *
  cos(radians(c.longitude) - radians($3)) +
  sin(radians($2)) * sin(radians(c.latitude))))
```

## 🚀 Workflows utilisateur

### Achat de produits
1. HomeScreen → liste produits
2. Clic produit → ProductDetailScreen
3. "Ajouter au panier" → CartContext
4. CartScreen → voir panier
5. "Proposer des recettes" → RecipesScreen avec ingrédients

### Découverte de recettes
1. RecipesScreen → recettes aléatoires
2. Recherche par nom/ingrédient
3. Filtre par catégorie
4. Clic recette → RecipeDetailScreen
5. Clic ingrédient → ProductDetailScreen du produit le plus proche

### Vente de produits (vendeur)
1. ProfileScreen → "Ajouter un produit"
2. AddProductScreen → formulaire complet
3. Upload image Cloudinary
4. Sélection ingrédients
5. Création dans PostgreSQL

## 📝 Notes importantes

- **Déboguer**: Utilisez les logs `console.log('[ComponentName] Message')` partout
- **Git**: Ne commitez JAMAIS `node_modules/` ou `.env`
- **Images**: Toujours via Cloudinary, jamais en base64 en BDD
- **Auth**: Tous les endpoints sauf `/auth/*` nécessitent JWT
- **Ingrédients**: Toujours en lowercase pour matching
- **Navigation**: Utilisez `navigation.navigate('Screen', { params })`
- **États**: Préférez Context API à Redux pour cette app
- **SQL**: Toujours `LEFT JOIN` pour tables optionnelles, `INNER JOIN` pour requises

## 🔄 Commandes utiles

```bash
# Restart backend
taskkill /F /IM node.exe 2>nul
cd ecostock_backend && npm start

# Vérifier BDD
psql -U postgres -d ecostock_db -c "SELECT * FROM recipes LIMIT 5;"

# Clean cache Expo
cd Eco_Front && npx expo start -c

# Git
git status
git add .
git commit -m "Message"
git push origin main
```

## 🎨 Style guide

- Couleurs principales:
  - Vert: `#166534` (primaire), `#10B981` (végétarien)
  - Rouge: `#EF4444` (erreur)
  - Gris: `#6B7280` (texte secondaire)
- Spacing: 8px, 12px, 16px, 20px
- Border radius: 8px, 12px, 16px
- Font sizes: 11px, 12px, 14px, 16px, 18px, 24px

---

**Dernière mise à jour**: Décembre 2024
**Version**: 1.0.0
