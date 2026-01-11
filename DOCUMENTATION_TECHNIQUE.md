# DOCUMENTATION TECHNIQUE - ECO_STOCK

## TABLE DES MATIÈRES

1. [Vue d'ensemble du projet](#1-vue-densemble-du-projet)
2. [Architecture globale](#2-architecture-globale)
3. [Stack technique](#3-stack-technique)
4. [Structure du projet](#4-structure-du-projet)
5. [Base de données](#5-base-de-données)
6. [Backend (API REST)](#6-backend-api-rest)
7. [Frontend (Application mobile)](#7-frontend-application-mobile)
8. [Sécurité](#8-sécurité)
9. [Bonnes pratiques implémentées](#9-bonnes-pratiques-implémentées)
10. [Mécanismes intelligents](#10-mécanismes-intelligents)
11. [Gestion des paiements](#11-gestion-des-paiements)
12. [Système de géolocalisation](#12-système-de-géolocalisation)
13. [Workflows et flux utilisateur](#13-workflows-et-flux-utilisateur)
14. [Tests et debugging](#14-tests-et-debugging)
15. [Déploiement](#15-déploiement)

---

## 1. VUE D'ENSEMBLE DU PROJET

### 1.1 Description

**Eco_Stock** est une marketplace mobile anti-gaspillage alimentaire qui connecte:
- **Vendeurs** (commerces) proposant des produits proches de leur DLC à prix réduit
- **Clients** achetant ces produits pour réduire le gaspillage
- **Associations** bénéficiant de plus de produits

### 1.2 Objectifs

- Réduire le gaspillage alimentaire
- Aide aux commerces à écouler leurs stocks
- Accès à des produits à prix réduit pour les consommateurs
- Support aux associations caritatives
- Sensibilisation écologique via tips éducatifs

### 1.3 Fonctionnalités principales

#### Pour les clients:
- Recherche de produits par proximité, catégorie, DLC, prix
- **Pagination avec scroll infini** pour le chargement progressif des produits
- Recherche de recettes basée sur les ingrédients disponibles
- Système de panier avec gestion des quantités
- Paiement sécurisé via Stripe
- Suivi des commandes
- Profil utilisateur (RGPD compliant)

#### Pour les vendeurs:
- Ajout/modification/suppression de produits
- Gestion du stock en temps réel
- Gestion des commandes clients
- Profil commerce avec géolocalisation
- Statistiques (en développement)

#### Pour les associations:
- Réception de dons
- Gestion des produits reçus
- Profil association

---

## 2. ARCHITECTURE GLOBALE

### 2.1 Architecture 3-tiers

```
┌─────────────────────────────────────────┐
│         FRONTEND (Mobile App)           │
│      React Native + Expo + TypeScript   │
│                                         │
│  - UI/UX avec React Navigation          │
│  - State management (Context API)       │
│  - Styles modulaires (StyleSheet)       │
└─────────────┬───────────────────────────┘
              │
              │ HTTP/HTTPS (REST API)
              │ JSON
              │
┌─────────────▼───────────────────────────┐
│         BACKEND (API Server)            │
│         Node.js + Express.js            │
│                                         │
│  - Routes RESTful                       │
│  - Middleware d'authentification JWT    │
│  - Business logic                       │
│  - Intégration Stripe & Cloudinary      │
└─────────────┬───────────────────────────┘
              │
              │ SQL Queries (pg driver)
              │
┌─────────────▼───────────────────────────┐
│         DATABASE (PostgreSQL)           │
│                                         │
│  - Tables relationnelles                │
│  - Triggers & Functions                 │
│  - Contraintes d'intégrité             │
│  - Index pour performance              │
└─────────────────────────────────────────┘
```

### 2.2 Flux de données

**Authentification:**
```
Mobile App → POST /api/auth/login → JWT Token → AsyncStorage → Header Authorization
```

**Récupération de produits:**
```
Mobile App → GET /api/products?filters → Backend → PostgreSQL → JSON Response → UI Render
```

**Paiement:**
```
Mobile App → Stripe SDK → Payment Intent → Backend → PostgreSQL (stock update) → Confirmation
```

---

## 3. STACK TECHNIQUE

### 3.1 Frontend

| Technologie | Version | Usage |
|-------------|---------|-------|
| **React** | 19.1.0 | Framework UI |
| **React Native** | 0.81.4 | Framework mobile cross-platform |
| **TypeScript** | ~5.9.2 | Typage statique |
| **Expo** | ~54.0.12 | Tooling et build |
| **React Navigation** | ^7.x | Navigation entre écrans |
| **Stripe React Native** | 0.50.3 | Paiements sécurisés |
| **AsyncStorage** | 2.2.0 | Stockage local persistant |
| **Expo Location** | ^19.0.8 | Géolocalisation |
| **Expo Image Picker** | ^17.0.10 | Upload photos |
| **Expo SecureStore** | ~15.0.8 | Stockage sécurisé (tokens) |
| **React Native Maps** | ^1.14.0 | Cartes interactives |
| **Lucide React Native** | ^0.544.0 | Icônes |

### 3.2 Backend

| Technologie | Version | Usage |
|-------------|---------|-------|
| **Node.js** | (LTS) | Runtime JavaScript |
| **Express.js** | ^4.18.2 | Framework web REST API |
| **PostgreSQL** | 18.0 | Base de données relationnelle |
| **pg** | ^8.11.3 | Driver PostgreSQL pour Node |
| **bcryptjs** | ^2.4.3 | Hachage mots de passe |
| **jsonwebtoken** | ^9.0.2 | Génération/vérification JWT |
| **dotenv** | ^16.3.1 | Variables d'environnement |
| **cors** | ^2.8.5 | Cross-Origin Resource Sharing |
| **express-validator** | ^7.0.1 | Validation des requêtes |
| **nodemon** | ^3.0.2 | Auto-reload en dev |

### 3.3 Services externes

- **Stripe** - Paiements en ligne sécurisés (mode test)
- **Cloudinary** - Hébergement et optimisation automatique d'images (pleinement opérationnel)
- **OpenStreetMap Nominatim** - Géocodage d'adresses et autocomplete

---

## 4. STRUCTURE DU PROJET

### 4.1 Structure Frontend (`Eco_Front/`)

```
Eco_Front/
├── App.tsx                          # Point d'entrée, Providers (Stripe, Cart, Navigation)
├── app.json                         # Configuration Expo
├── package.json                     # Dépendances npm
├── tsconfig.json                    # Configuration TypeScript
├── index.ts                         # Bootstrap Expo
│
└── src/
    ├── components/                  # Composants réutilisables
    │   ├── AddressAutocomplete.tsx  # Autocomplete adresses OSM
    │   ├── AuthHeader.tsx           # Header pages auth
    │   ├── BottomNavBar.tsx         # Navigation bas écran (deprecated)
    │   ├── Button.tsx               # Bouton générique
    │   ├── EcoTip.tsx               # Affichage tips écologiques
    │   ├── FilterModal.tsx/styles   # Modal filtres produits
    │   ├── IngredientAutocomplete   # Autocomplete ingrédients
    │   ├── Input.tsx                # Input générique
    │   ├── ProductCard.tsx          # Card affichage produit
    │   └── SocialButton/Icons       # Boutons réseaux sociaux
    │
    ├── constants/
    │   └── colors.ts                # Palette de couleurs (deprecated)
    │
    ├── contexts/
    │   └── CartContext.tsx          # Context API pour le panier global
    │
    ├── navigation/                  # Configuration React Navigation
    │   ├── AuthNavigator.tsx        # Stack navigation authentification
    │   ├── HomeNavigator.tsx        # Stack navigation home
    │   ├── MainTabNavigator.tsx     # Bottom tabs principal
    │   ├── ProfileNavigator.tsx     # Stack navigation profil
    │   ├── RootNavigator.tsx        # Root navigator (auth/main)
    │   ├── SearchNavigator.tsx      # Stack navigation recherche
    │   └── types.ts                 # Types TypeScript navigation
    │
    ├── screens/                     # Écrans de l'application
    │   ├── auth/
    │   │   └── LoginScreenWrapper   # Wrapper écran login
    │   ├── AddProductScreen.*       # Ajout produit (vendeur)
    │   ├── CartScreen.*             # Panier
    │   ├── ForgotPasswordScreen.*   # Récupération mot de passe
    │   ├── HomeScreen.*             # Écran d'accueil
    │   ├── LoginScreen.*            # Connexion
    │   ├── OrdersScreen.*           # Commandes client
    │   ├── PaymentMethodsScreen.*   # Méthodes de paiement
    │   ├── PaymentScreen.*          # Paiement Stripe
    │   ├── PersonalInfoScreen.*     # Infos personnelles (RGPD)
    │   ├── ProductDetailScreen.*    # Détail produit
    │   ├── ProfileScreen.*          # Profil utilisateur
    │   ├── RecipeDetailScreen.*     # Détail recette
    │   ├── RecipesScreen.*          # Liste recettes
    │   ├── SearchScreen.*           # Recherche produits
    │   ├── SellerOrdersScreen.*     # Commandes vendeur
    │   ├── SellerProductsScreen.*   # Produits vendeur
    │   ├── SignupScreen.*           # Inscription
    │   └── SplashScreen.*           # Écran de chargement
    │
    ├── services/
    │   └── api.ts                   # Service API (toutes les requêtes HTTP)
    │
    ├── theme/                       # Thème design system
    │   ├── colors.ts                # Couleurs
    │   ├── spacing.ts               # Espacements
    │   ├── typography.ts            # Typographie
    │   └── index.ts                 # Export centralisé
    │
    └── utils/
        └── ecoTips.ts               # Tips écologiques aléatoires
```

### 4.2 Structure Backend (`ecostock_backend/`)

```
ecostock_backend/
├── server.js                        # Point d'entrée Express
├── package.json                     # Dépendances npm
├── .env                             # Variables d'environnement (gitignored)
├── backup.sql                       # Sauvegarde base de données
│
├── config/
│   └── database.js                  # Configuration connexion PostgreSQL
│
├── middleware/
│   ├── auth.js                      # Middleware vérification JWT
│   └── checkUserType.js             # Middleware vérification rôle utilisateur
│
├── routes/                          # Routes API REST
│   ├── auth.js                      # Authentification (register, login, verify)
│   ├── ingredients.js               # CRUD ingrédients
│   ├── payment.js                   # Paiements Stripe
│   ├── products.js                  # Produits (lecture)
│   ├── profile.js                   # Profil utilisateur
│   ├── recipes.js                   # Recettes
│   └── seller.js                    # Gestion vendeur (produits, commandes)
│
├── services/
│   └── cloudinary.js                # Service upload images (prévu)
│
└── utils/
    ├── cleanupExpiredProducts.js    # Nettoyage produits expirés
    └── fuzzyMatch.js                # Recherche floue ingrédients
```

---

## 5. BASE DE DONNÉES

### 5.1 Schéma PostgreSQL

#### Table `users`
Stocke tous les utilisateurs (clients, vendeurs, associations)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prenom VARCHAR(100),                    -- Optionnel (RGPD)
    nom VARCHAR(100),                       -- Optionnel (RGPD)
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,         -- Haché avec bcrypt
    user_type VARCHAR(20) NOT NULL,         -- 'client' | 'vendeur' | 'association'
    nom_association VARCHAR(255),           -- Si association
    telephone VARCHAR(20),
    adresse TEXT,
    ville VARCHAR(100),
    code_postal VARCHAR(10),
    photo_profil TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_user_type_check CHECK (user_type IN ('vendeur', 'client', 'association'))
);
```

#### Table `commerces`
Informations des commerces (pour les vendeurs)

```sql
CREATE TABLE commerces (
    id SERIAL PRIMARY KEY,
    vendeur_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nom_commerce VARCHAR(255) NOT NULL,
    adresse TEXT NOT NULL,
    latitude DECIMAL(10, 8),                -- Géolocalisation
    longitude DECIMAL(11, 8),               -- Géolocalisation
    telephone VARCHAR(20),
    description TEXT,
    horaires_ouverture TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vendeur_id)
);
```

#### Table `categories`
Catégories de produits

```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Données initiales
INSERT INTO categories (nom) VALUES
('Fruits et légumes'), ('Produits laitiers'), ('Viande et poisson'),
('Pain et viennoiseries'), ('Épicerie'), ('Surgelés'), ('Boissons'), ('Autre');
```

#### Table `produits`
Produits mis en vente

```sql
CREATE TABLE produits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    prix DECIMAL(10, 2) NOT NULL,           -- Prix réduit
    prix_original DECIMAL(10, 2),           -- Prix d'origine
    dlc DATE NOT NULL,                      -- Date limite consommation
    category_id INTEGER REFERENCES categories(id),
    commerce_id INTEGER REFERENCES commerces(id) ON DELETE CASCADE,
    image_url TEXT,
    is_disponible BOOLEAN DEFAULT true,
    stock INTEGER DEFAULT 1 NOT NULL,       -- Quantité disponible
    pickup_start_time TIME,                 -- Heure début retrait
    pickup_end_time TIME,                   -- Heure fin retrait
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table `commandes`
Commandes clients

```sql
CREATE TABLE commandes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_commande VARCHAR(20) UNIQUE NOT NULL,  -- Format: CMD-YYYY-NNNNNN
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    commerce_id INTEGER NOT NULL REFERENCES commerces(id) ON DELETE CASCADE,
    total DECIMAL(10, 2) NOT NULL,
    statut VARCHAR(20) DEFAULT 'en_attente',
    stripe_payment_intent_id VARCHAR(255),
    stripe_payment_status VARCHAR(50),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT commandes_statut_check CHECK (statut IN ('en_attente', 'confirmee', 'prete', 'recuperee', 'annulee'))
);

-- Trigger génération numéro de commande
CREATE SEQUENCE commandes_sequence START 1;

CREATE OR REPLACE FUNCTION generate_numero_commande()
RETURNS TRIGGER AS $$
BEGIN
    NEW.numero_commande := 'CMD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('commandes_sequence')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_numero_commande
BEFORE INSERT ON commandes
FOR EACH ROW
EXECUTE FUNCTION generate_numero_commande();
```

#### Table `commande_items`
Articles dans chaque commande

```sql
CREATE TABLE commande_items (
    id SERIAL PRIMARY KEY,
    commande_id UUID NOT NULL REFERENCES commandes(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
    quantite INTEGER NOT NULL DEFAULT 1,    -- Quantité achetée
    prix_unitaire DECIMAL(10, 2) NOT NULL,  -- Prix au moment de l'achat
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table `ingredients`
Ingrédients pour le système de recettes

```sql
CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table `product_ingredients`
Relation many-to-many produits ↔ ingrédients

```sql
CREATE TABLE product_ingredients (
    id SERIAL PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
    ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    UNIQUE(product_id, ingredient_id)
);
```

#### Table `recettes`
Recettes suggérées

```sql
CREATE TABLE recettes (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT NOT NULL,
    temps_preparation INTEGER,              -- En minutes
    difficulte VARCHAR(20),                 -- 'facile' | 'moyen' | 'difficile'
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table `recette_ingredients`
Ingrédients requis par recette

```sql
CREATE TABLE recette_ingredients (
    id SERIAL PRIMARY KEY,
    recette_id INTEGER NOT NULL REFERENCES recettes(id) ON DELETE CASCADE,
    ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantite VARCHAR(100),                  -- Ex: "200g", "2 pièces"
    UNIQUE(recette_id, ingredient_id)
);
```

### 5.2 Index pour performance

```sql
-- Index sur les champs fréquemment recherchés
CREATE INDEX idx_produits_category ON produits(category_id);
CREATE INDEX idx_produits_commerce ON produits(commerce_id);
CREATE INDEX idx_produits_dlc ON produits(dlc);
CREATE INDEX idx_produits_disponible ON produits(is_disponible);
CREATE INDEX idx_commandes_client ON commandes(client_id);
CREATE INDEX idx_commandes_commerce ON commandes(commerce_id);
CREATE INDEX idx_commandes_statut ON commandes(statut);
```

### 5.3 Triggers

#### Trigger `update_updated_at`
Met à jour automatiquement le champ `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliqué sur users, produits, commandes
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produits_updated_at BEFORE UPDATE ON produits
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commandes_updated_at BEFORE UPDATE ON commandes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 5.4 Vues SQL

#### Vue `user_orders_with_pickup`
Jointure complexe pour récupérer les commandes avec toutes les infos

```sql
CREATE VIEW user_orders_with_pickup AS
SELECT
    c.id AS commande_id,
    c.numero_commande,
    c.total,
    c.statut,
    c.stripe_payment_status,
    c.paid_at,
    c.created_at,
    c.client_id,
    u_vendeur.nom AS vendeur_nom,
    u_vendeur.email AS vendeur_email,
    com.nom_commerce,
    com.adresse AS commerce_address,
    com.latitude AS commerce_latitude,
    com.longitude AS commerce_longitude,
    ci.product_id,
    p.nom AS product_name,
    p.image_url AS product_image,
    p.dlc AS product_dlc,
    ci.quantite,
    (ci.prix_unitaire * ci.quantite) AS line_total,
    p.pickup_start_time,
    p.pickup_end_time
FROM commandes c
JOIN commande_items ci ON c.id = ci.commande_id
JOIN produits p ON ci.product_id = p.id
JOIN commerces com ON c.commerce_id = com.id
JOIN users u_vendeur ON com.vendeur_id = u_vendeur.id;
```

---

## 6. BACKEND (API REST)

### 6.1 Configuration (`server.js`)

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware global
app.use(cors());                                    // CORS pour requêtes cross-origin
app.use(express.json({ limit: '10mb' }));          // Parser JSON (images base64)
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/recipes', recipesRoutes);
app.use('/api/ingredients', ingredientsRoutes);
app.use('/api/payment', paymentRoutes);

// Route d'accueil (documentation endpoints)
app.get('/', (req, res) => { /* ... */ });

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, status: 'OK' });
});

// Gestion erreur 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route introuvable' });
});

// Gestion erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(500).json({ success: false, message: 'Erreur serveur' });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
```

### 6.2 Configuration Database (`config/database.js`)

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecostock_db',
  password: process.env.DB_PASSWORD || 'votre_password',
  port: process.env.DB_PORT || 5432,
});

// Test connexion au démarrage
pool.connect((err, client, release) => {
  if (err) {
    console.error('Erreur connexion PostgreSQL:', err.stack);
  } else {
    console.log('✓ Connexion PostgreSQL établie');
    release();
  }
});

module.exports = pool;
```

### 6.3 Middleware d'authentification (`middleware/auth.js`)

```javascript
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token manquant'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }
    req.user = user;  // Attache l'utilisateur à la requête
    next();
  });
};

module.exports = authenticateToken;
```

### 6.4 Middleware vérification rôle (`middleware/checkUserType.js`)

```javascript
const checkUserType = (...allowedTypes) => {
  return (req, res, next) => {
    if (!req.user || !req.user.user_type) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    if (!allowedTypes.includes(req.user.user_type)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé pour ce type d\'utilisateur'
      });
    }

    next();
  };
};

module.exports = checkUserType;
```

### 6.5 Routes principales

#### `/api/auth` - Authentification

**POST `/api/auth/register`** - Inscription
```javascript
// Body: { prenom?, nom?, email, password, user_type, nom_commerce?, adresse_commerce?, latitude?, longitude?, nom_association? }
// Response: { success, message, token, user }
```

**POST `/api/auth/login`** - Connexion
```javascript
// Body: { email, password }
// Response: { success, message, token, user }
```

**GET `/api/auth/verify`** - Vérification token (protected)
```javascript
// Headers: Authorization: Bearer <token>
// Response: { success, user }
```

#### `/api/products` - Produits

**GET `/api/products`** - Liste produits avec filtres
```javascript
// Query params:
//   - category_id: filter par catégorie
//   - commerce_id: filter par commerce
//   - search: recherche dans nom/description
//   - min_price, max_price: filter par prix
//   - latitude, longitude, radius: recherche géographique
// Response: { success, products: [...] }
```

**GET `/api/products/:id`** - Détail produit
```javascript
// Response: { success, product: {...} }
```

#### `/api/seller` - Gestion vendeur (protected)

**GET `/api/seller/my-products`** - Mes produits
```javascript
// Headers: Authorization: Bearer <token>
// Response: { success, products: [...] }
```

**POST `/api/seller/products`** - Ajouter produit
```javascript
// Body: { nom, description, prix, prix_original, dlc, category_id, stock, image_url?, pickup_start_time?, pickup_end_time?, ingredient_ids? }
// Response: { success, message, product }
```

**PUT `/api/seller/products/:id`** - Modifier produit
```javascript
// Body: { nom?, description?, prix?, dlc?, stock?, is_disponible?, ... }
// Response: { success, message, product }
```

**DELETE `/api/seller/products/:id`** - Supprimer produit
```javascript
// Response: { success, message }
```

**GET `/api/seller/orders`** - Commandes reçues
```javascript
// Response: { success, orders: [...] }
```

**PUT `/api/seller/orders/:id/status`** - Changer statut commande
```javascript
// Body: { statut: 'confirmee' | 'prete' | 'recuperee' | 'annulee' }
// Response: { success, message }
```

**GET `/api/seller/categories`** - Liste catégories
```javascript
// Response: { success, categories: [...] }
```

#### `/api/payment` - Paiements Stripe (protected)

**POST `/api/payment/create-payment-intent`** - Créer payment intent
```javascript
// Body: { items: [{ product_id, quantity }] }
// Response: { success, paymentIntent, clientSecret }
```

**POST `/api/payment/confirm`** - Confirmer paiement
```javascript
// Body: { paymentIntentId, items }
// Response: { success, message, commande }
```

#### `/api/recipes` - Recettes

**GET `/api/recipes`** - Liste recettes
```javascript
// Query: ingredient_ids (comma-separated)
// Response: { success, recipes: [...] }
```

**GET `/api/recipes/:id`** - Détail recette
```javascript
// Response: { success, recipe: {...} }
```

#### `/api/ingredients` - Ingrédients

**GET `/api/ingredients`** - Liste ingrédients
```javascript
// Query: search (fuzzy match)
// Response: { success, ingredients: [...] }
```

**GET `/api/ingredients/suggestions`** - Suggestions ingrédients
```javascript
// Query: query
// Response: { success, suggestions: [...] }
```

#### `/api/profile` - Profil utilisateur (protected)

**GET `/api/profile`** - Mon profil
```javascript
// Response: { success, profile: {...} }
```

**PUT `/api/profile`** - Modifier profil
```javascript
// Body: { prenom?, nom?, email, phone?, nom_commerce?, adresse_commerce?, nom_association?, adresse?, ville?, code_postal? }
// Response: { success, message, profile }
```

---

## 7. FRONTEND (APPLICATION MOBILE)

### 7.1 Configuration TypeScript (`tsconfig.json`)

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "jsx": "react-native",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### 7.2 Architecture de navigation

#### Hiérarchie React Navigation

```
RootNavigator (Switch)
├── SplashScreen (Loading)
│
├── AuthNavigator (Stack)
│   ├── LoginScreen
│   ├── SignupScreen
│   └── ForgotPasswordScreen
│
└── MainTabNavigator (Bottom Tabs)
    ├── HomeTab (Stack - HomeNavigator)
    │   ├── HomeScreen
    │   ├── ProductDetailScreen
    │   └── CartScreen
    │
    ├── SearchTab (Stack - SearchNavigator)
    │   ├── SearchScreen
    │   ├── ProductDetailScreen
    │   └── RecipesScreen
    │       └── RecipeDetailScreen
    │
    └── ProfileTab (Stack - ProfileNavigator)
        ├── ProfileScreen
        ├── PersonalInfoScreen
        ├── OrdersScreen
        ├── PaymentMethodsScreen
        ├── PaymentScreen
        ├── SellerProductsScreen (si vendeur)
        │   └── AddProductScreen
        └── SellerOrdersScreen (si vendeur)
```

#### Types de navigation (`navigation/types.ts`)

```typescript
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
};

export type SearchStackParamList = {
  SearchMain: undefined;
  ProductDetail: { productId: string };
  Recipes: { ingredientIds?: string[] };
  RecipeDetail: { recipeId: number };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  PersonalInfo: undefined;
  Orders: undefined;
  PaymentMethods: undefined;
  Payment: { items: any[] };
  SellerProducts: undefined;
  AddProduct: { productId?: string };
  SellerOrders: undefined;
};
```

### 7.3 Context API - Panier (`contexts/CartContext.tsx`)

**State management global pour le panier**

```typescript
interface CartProduct {
  id: string;
  nom: string;
  description: string;
  prix: string;
  prix_original: string;
  image_url: string | null;
  dlc: string;
  nom_commerce: string;
  category_name: string;
  stock: number;
  ingredient_nom?: string;
  ingredient_ids?: number[];
  quantity?: number;
}

interface CartContextType {
  cartItems: CartProduct[];
  addToCart: (product: CartProduct) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getCartTotal: () => number;
  updateQuantity: (productId: string, quantity: number) => void;
  getProductQuantity: (productId: string) => number;
  removeUnavailableProducts: (unavailableIds: string[]) => void;
  cartCount: number;
}
```

**Fonctionnalités:**
- Ajout/suppression produits
- Gestion quantités (max = stock)
- Persistance avec AsyncStorage
- Suppression automatique produits indisponibles
- Calcul total panier

### 7.4 Service API (`services/api.ts`)

**Centralisation de toutes les requêtes HTTP**

```typescript
const BASE_URL = 'http://192.168.1.81:3000/api';

// Helper pour headers avec token
const getAuthHeaders = async () => {
  const token = await SecureStore.getItemAsync('userToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Fonctions API
export const API = {
  // Auth
  register: async (data: { ... }) => { ... },
  login: async (email: string, password: string) => { ... },
  verifyToken: async () => { ... },

  // Products
  getProducts: async (filters?: { ... }) => { ... },
  getProductById: async (id: string) => { ... },

  // Seller
  getMyProducts: async () => { ... },
  addProduct: async (data: { ... }) => { ... },
  updateProduct: async (id: string, data: { ... }) => { ... },
  deleteProduct: async (id: string) => { ... },
  getSellerOrders: async () => { ... },
  updateOrderStatus: async (orderId: string, statut: string) => { ... },

  // Recipes
  getRecipes: async (ingredientIds?: string[]) => { ... },
  getRecipeById: async (id: number) => { ... },

  // Ingredients
  getIngredients: async (search?: string) => { ... },

  // Payment
  createPaymentIntent: async (items: any[]) => { ... },
  confirmPayment: async (paymentIntentId: string, items: any[]) => { ... },

  // Profile
  getProfile: async () => { ... },
  updateProfile: async (data: { ... }) => { ... },
  getOrders: async () => { ... },
};
```

### 7.5 Composants clés

#### `AddressAutocomplete.tsx`
**Autocomplete adresses avec OpenStreetMap Nominatim**

- Recherche en temps réel (debounce 500ms)
- Filtrage France uniquement
- Retour coordonnées GPS (latitude, longitude)
- Validation obligatoire sélection suggestion
- Indicateur visuel de validation (✓)

```typescript
const searchAddress = async (query: string) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(query)}&` +
    `format=json&addressdetails=1&limit=5&countrycodes=fr`,
    { headers: { 'User-Agent': 'EcoStock-App' } }
  );
  const data = await response.json();
  setSuggestions(data);
};
```

#### `ProductCard.tsx`
**Carte produit réutilisable**

- Affichage image, nom, prix, DLC, stock
- Badge catégorie
- Prix original barré
- Badge urgence DLC (< 3 jours = rouge)
- Gestion état indisponible (opacité réduite)

#### `FilterModal.tsx`
**Modal filtres produits**

- Filtres: catégorie, prix min/max, DLC, commerce
- Recherche par nom
- Tri: prix croissant/décroissant, DLC proche
- État local avec useState
- Réinitialisation filtres

#### `IngredientAutocomplete.tsx`
**Autocomplete ingrédients avec fuzzy matching**

- Recherche backend avec algorithme fuzzy
- Sélection multiple (chips)
- Création nouveau ingrédient si non trouvé

### 7.6 Écrans principaux

#### `HomeScreen.tsx`
**Page d'accueil**

- Liste produits disponibles
- Bouton filtres (ouvre FilterModal)
- Refresh control (pull-to-refresh)
- Navigation vers ProductDetailScreen
- Badge nombre articles panier
- Géolocalisation optionnelle (recherche proximité)

#### `ProductDetailScreen.tsx`
**Détail produit**

- Affichage complet informations produit
- Sélecteur quantité (max = stock)
- Bouton "Ajouter au panier"
- Affichage ingrédients (si renseignés)
- Horaires retrait
- Map avec localisation commerce

#### `CartScreen.tsx`
**Panier**

- Liste produits ajoutés
- Modification quantités
- Suppression produits
- Affichage total
- Bouton "Voir les recettes" (navigation vers RecipesScreen avec ingrédients du panier)
- Bouton "Passer au paiement"
- Vérification automatique disponibilité au focus (`useFocusEffect`)
- Suppression automatique produits indisponibles
- Eco tip aléatoire

```typescript
const checkProductsAvailability = async () => {
  const unavailableProducts: string[] = [];

  for (const item of cartItems) {
    const response = await API.getProductById(item.id);
    if (!response.product?.is_disponible || response.product.stock <= 0) {
      unavailableProducts.push(item.id);
    }
  }

  if (unavailableProducts.length > 0) {
    removeUnavailableProducts(unavailableProducts);
    Alert.alert('Produits indisponibles', 'Certains produits ont été retirés du panier');
  }
};

useFocusEffect(
  React.useCallback(() => {
    checkProductsAvailability();
  }, [cartItems])
);
```

#### `PaymentScreen.tsx`
**Paiement Stripe**

- Intégration `@stripe/stripe-react-native`
- CardField pour saisie carte bancaire
- Création Payment Intent
- Confirmation paiement
- Mise à jour stock backend
- Création commande
- Eco tip aléatoire

```typescript
import { CardField, useStripe } from '@stripe/stripe-react-native';

const handlePayment = async () => {
  // 1. Créer Payment Intent
  const { clientSecret } = await API.createPaymentIntent(cartItems);

  // 2. Confirmer paiement avec Stripe SDK
  const { error, paymentIntent } = await confirmPayment(clientSecret, {
    paymentMethodType: 'Card',
  });

  if (error) {
    Alert.alert('Erreur', error.message);
    return;
  }

  // 3. Confirmer côté backend (création commande, décrémentation stock)
  await API.confirmPayment(paymentIntent.id, cartItems);

  // 4. Vider panier et rediriger
  clearCart();
  navigation.navigate('Orders');
};
```

#### `SearchScreen.tsx`
**Recherche produits avancée**

- Barre de recherche
- Filtres (catégorie, prix, DLC)
- Tri
- Géolocalisation (recherche par proximité)
- Navigation vers RecipesScreen (recherche par ingrédients)

#### `RecipesScreen.tsx`
**Liste recettes**

- Affichage recettes
- Filtrage par ingrédients disponibles (du panier ou sélectionnés)
- Score de correspondance (% ingrédients disponibles)
- Navigation vers RecipeDetailScreen

```typescript
// Calcul score correspondance
const matchScore = recipe.ingredients.filter(ing =>
  availableIngredients.includes(ing.id)
).length / recipe.ingredients.length * 100;
```

#### `RecipeDetailScreen.tsx`
**Détail recette**

- Nom, description, image
- Liste ingrédients avec quantités
- Instructions détaillées
- Temps préparation
- Difficulté

#### `AddProductScreen.tsx` (Vendeur)
**Ajout/modification produit**

- Formulaire complet
- Sélection catégorie (dropdown)
- Upload image (expo-image-picker)
- Sélection DLC (DateTimePicker)
- Champ stock (quantité disponible)
- Autocomplete ingrédients (multi-select)
- Horaires retrait (TimePickerModal)
- Eco tip aléatoire

#### `SellerProductsScreen.tsx` (Vendeur)
**Gestion produits vendeur**

- Liste mes produits
- Badges stock/disponibilité
- Actions: modifier, supprimer, activer/désactiver
- Navigation vers AddProductScreen

#### `SellerOrdersScreen.tsx` (Vendeur)
**Gestion commandes**

- Liste commandes reçues
- Filtrage par statut
- Détails: client, produits, montant
- Actions: changer statut (confirmée, prête, récupérée)

#### `OrdersScreen.tsx` (Client)
**Mes commandes**

- Liste commandes passées
- Détails: numéro, date, montant, statut
- Informations retrait (adresse, horaires)
- Carte avec localisation commerce

#### `ProfileScreen.tsx`
**Profil utilisateur**

- Affichage infos utilisateur
- Navigation vers sous-écrans:
  - Informations personnelles
  - Mes commandes
  - Moyens de paiement
  - Mes produits (si vendeur)
  - Commandes reçues (si vendeur)
- Déconnexion (suppression token SecureStore)

#### `PersonalInfoScreen.tsx`
**Informations personnelles (RGPD compliant)**

- Champs optionnels: prenom, nom (RGPD data minimization)
- Champs obligatoires: email
- Champs conditionnels: nom_commerce (vendeur), nom_association (association)
- Validation email
- Validation code postal (regex `/^\d{5}$/`)
- Autocomplete adresse (si vendeur)
- Envoi `undefined` pour champs vides (pas `null` ni `""`)

```typescript
const profileData = {
  prenom: prenom.trim() || undefined,  // Optionnel
  nom: nom.trim() || undefined,        // Optionnel
  email: email.trim(),                 // Obligatoire
  phone: phone.trim() || undefined,
  // ...
};
```

### 7.7 Styles

**Organisation par fichier:**
- Chaque écran a son fichier `.styles.ts` associé
- Utilisation de `StyleSheet.create()` pour performance
- Convention de nommage descriptive

```typescript
// CartScreen.styles.ts
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    // ...
  },
  // ...
});
```

**Design system (`theme/`):**
```typescript
// colors.ts
export const colors = {
  primary: '#16A34A',
  secondary: '#4F46E5',
  danger: '#DC2626',
  warning: '#F59E0B',
  // ...
};

// spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// typography.ts
export const typography = {
  h1: { fontSize: 32, fontWeight: 'bold' },
  h2: { fontSize: 24, fontWeight: 'bold' },
  body: { fontSize: 16 },
  // ...
};
```

---

## 8. SÉCURITÉ

### 8.1 Authentification JWT

**Flux d'authentification:**

1. **Login/Register:**
   - Frontend → POST `/api/auth/login` avec `{ email, password }`
   - Backend vérifie credentials (bcrypt)
   - Backend génère JWT avec payload: `{ userId, email, user_type }`
   - JWT signé avec `JWT_SECRET` (durée: 7 jours)
   - Frontend stocke token dans `SecureStore`

2. **Requêtes protégées:**
   - Frontend ajoute header `Authorization: Bearer <token>`
   - Middleware `authenticateToken` vérifie et décode JWT
   - `req.user` contient les infos utilisateur
   - Routes protégées par middleware

```javascript
// Backend - génération JWT
const token = jwt.sign(
  { userId: user.id, email: user.email, user_type: user.user_type },
  JWT_SECRET,
  { expiresIn: '7d' }
);

// Frontend - stockage sécurisé
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('userToken', token);

// Frontend - ajout header
const token = await SecureStore.getItemAsync('userToken');
headers: { Authorization: `Bearer ${token}` }
```

### 8.2 Hachage mots de passe (bcrypt)

```javascript
const bcrypt = require('bcryptjs');

// Inscription - hashage
const hashedPassword = await bcrypt.hash(password, 10);  // 10 rounds

// Connexion - vérification
const isValid = await bcrypt.compare(password, user.password);
```

### 8.3 Validation des entrées

**Backend avec `express-validator`:**

```javascript
const { body, validationResult } = require('express-validator');

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('user_type').isIn(['client', 'vendeur', 'association']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  // ...
});
```

**Frontend avec validation manuelle:**

```typescript
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateCodePostal = (code: string): boolean => {
  const codeRegex = /^\d{5}$/;
  return code === '' || codeRegex.test(code);
};
```

### 8.4 Protection contre injections SQL

**Requêtes paramétrées avec `pg`:**

```javascript
// ❌ DANGEREUX (injection SQL)
db.query(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ SÉCURISÉ (paramètres)
db.query('SELECT * FROM users WHERE email = $1', [email]);
```

**Toutes les requêtes utilisent des paramètres:**

```javascript
const result = await db.query(
  'INSERT INTO produits (nom, prix, dlc, commerce_id) VALUES ($1, $2, $3, $4) RETURNING *',
  [nom, prix, dlc, commerce_id]
);
```

### 8.5 CORS Configuration

```javascript
const cors = require('cors');
app.use(cors());  // Permet tous les origins en dev

// Production: restreindre origins
app.use(cors({
  origin: 'https://votre-domaine.com',
  credentials: true
}));
```

### 8.6 Variables d'environnement (`.env`)

```bash
# Base de données
DB_USER=postgres
DB_HOST=localhost
DB_NAME=ecostock_db
DB_PASSWORD=your_password
DB_PORT=5432

# JWT
JWT_SECRET=your-super-secret-key-change-in-production

# Server
PORT=3000

# Stripe (backend)
STRIPE_SECRET_KEY=sk_test_...

# Cloudinary (prévu)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

**Frontend (`App.tsx`):**
```typescript
const STRIPE_PUBLISHABLE_KEY = 'pk_test_...';  // Clé publique OK
```

### 8.7 RGPD Compliance

**Minimisation des données:**
- Champs `prenom` et `nom` optionnels
- Seul l'email est obligatoire
- Labels UI: "(optionnel)"
- Backend accepte `null`/`undefined`

**Droits utilisateur:**
- Lecture profil: `GET /api/profile`
- Modification profil: `PUT /api/profile`
- Suppression (à implémenter): `DELETE /api/profile`

**Consentement:**
- Géolocalisation: demande permission utilisateur
- Photos: permission camera/gallery

---

## 9. BONNES PRATIQUES IMPLÉMENTÉES

### 9.1 Architecture

✅ **Séparation des préoccupations**
- Backend: routes / middleware / services / utils
- Frontend: screens / components / contexts / services / navigation

✅ **Principe DRY (Don't Repeat Yourself)**
- Composants réutilisables (Button, Input, ProductCard)
- Service API centralisé
- Styles modulaires

✅ **Single Responsibility Principle**
- Chaque composant a une responsabilité unique
- Routes backend organisées par domaine

### 9.2 Code Quality

✅ **TypeScript**
- Typage statique complet
- Interfaces pour props et données
- Types pour navigation

```typescript
interface CartProduct {
  id: string;
  nom: string;
  prix: string;
  // ...
}
```

✅ **Gestion d'erreurs**
- Try/catch systématiques sur requêtes async
- Affichage messages utilisateur via Alert
- Logs erreurs console

```typescript
try {
  const response = await API.getProducts();
  setProducts(response.products);
} catch (error) {
  console.error('Erreur chargement produits:', error);
  Alert.alert('Erreur', 'Impossible de charger les produits');
}
```

✅ **Async/Await**
- Préféré à `.then().catch()`
- Code plus lisible et maintenable

✅ **Constants et configuration**
- URL API centralisée
- Couleurs/espacements dans theme
- Tips écologiques dans `ecoTips.ts`

### 9.3 Performance

✅ **Memoization React**
```typescript
const MemoizedProductCard = React.memo(ProductCard);
```

✅ **useFocusEffect vs useEffect**
- `useFocusEffect` pour actions au focus écran
- Évite exécutions inutiles

✅ **Debouncing**
- Recherche adresses: 500ms
- Recherche ingrédients: 300ms

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    searchAddress(value);
  }, 500);
  return () => clearTimeout(timer);
}, [value]);
```

✅ **Pagination/Limit (à améliorer)**
- Actuellement: chargement complet
- TODO: Pagination avec offset/limit

### 9.4 UX/UI

✅ **Loading states**
```typescript
const [loading, setLoading] = useState(false);

{loading ? <ActivityIndicator /> : <Content />}
```

✅ **Pull-to-refresh**
```typescript
<FlatList
  data={products}
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
/>
```

✅ **Feedback utilisateur**
- Alert pour confirmations/erreurs
- Messages de succès
- Indicateurs visuels (badges, couleurs)

✅ **Accessibilité**
- Labels descriptifs
- Placeholders explicites
- Contrastes couleurs

### 9.5 Maintenance

✅ **Commentaires explicatifs**
```typescript
// Vérifier disponibilité produits au retour sur l'écran
useFocusEffect(
  React.useCallback(() => {
    checkProductsAvailability();
  }, [cartItems])
);
```

✅ **Nommage descriptif**
- Variables: `cartItems`, `isLoading`, `userProfile`
- Fonctions: `handlePayment`, `fetchProducts`, `updateQuantity`
- Composants: `ProductDetailScreen`, `AddressAutocomplete`

✅ **Console.log stratégiques**
```javascript
console.log(`${req.method} ${req.path}`);  // Logger requêtes
console.log('[App] Starting application');  // Debugging
```

✅ **Health check endpoint**
```javascript
app.get('/health', (req, res) => {
  res.json({ success: true, status: 'OK' });
});
```

---

## 10. MÉCANISMES INTELLIGENTS

### 10.1 Matching Recettes par Ingrédients

**Algorithme de scoring:**

```sql
-- Backend calcul score correspondance
SELECT
  r.*,
  COUNT(ri.ingredient_id) as total_ingredients,
  COUNT(CASE WHEN pi.ingredient_id IS NOT NULL THEN 1 END) as matching_ingredients,
  ROUND(
    COUNT(CASE WHEN pi.ingredient_id IS NOT NULL THEN 1 END)::numeric /
    COUNT(ri.ingredient_id)::numeric * 100
  ) as match_percentage
FROM recettes r
JOIN recette_ingredients ri ON r.id = ri.recette_id
LEFT JOIN product_ingredients pi ON ri.ingredient_id = pi.ingredient_id
WHERE pi.product_id IN (SELECT product_id FROM cart_items)
GROUP BY r.id
HAVING match_percentage >= 50  -- Minimum 50% ingrédients
ORDER BY match_percentage DESC;
```

**Frontend affichage:**
```typescript
<Text>
  {matchScore}% des ingrédients disponibles dans votre panier
</Text>
```

### 10.2 Recherche Floue (Fuzzy Matching)

**Algorithme Levenshtein Distance pour ingrédients:**

```javascript
// utils/fuzzyMatch.js
function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,  // substitution
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j] + 1       // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function fuzzyMatch(query, target, threshold = 0.7) {
  const distance = levenshteinDistance(query.toLowerCase(), target.toLowerCase());
  const maxLength = Math.max(query.length, target.length);
  const similarity = 1 - (distance / maxLength);
  return similarity >= threshold;
}

module.exports = { fuzzyMatch };
```

**Usage:**
```javascript
// Recherche "tommate" trouve "tomate"
const results = ingredients.filter(ing =>
  fuzzyMatch(searchQuery, ing.nom, 0.7)
);
```

### 10.3 Pagination avec Scroll Infini

**Implémentation backend (offset-based pagination):**

```javascript
// routes/products.js
router.get('/', authenticateToken, async (req, res) => {
  const { page = 1, limit = 20, category, minPrice, maxPrice } = req.query;

  const currentPage = parseInt(page);
  const pageLimit = parseInt(limit);
  const offset = (currentPage - 1) * pageLimit;

  // Compter le total de produits
  const countResult = await db.query(
    `SELECT COUNT(DISTINCT p.id) as total FROM products p WHERE ...`,
    params
  );

  const totalProducts = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(totalProducts / pageLimit);

  // Requête avec LIMIT/OFFSET
  const result = await db.query(
    `SELECT ... FROM products p ... LIMIT $x OFFSET $y`,
    [...params, pageLimit, offset]
  );

  res.json({
    success: true,
    products,
    pagination: {
      currentPage,
      totalPages,
      totalProducts,
      limit: pageLimit,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    }
  });
});
```

**Implémentation frontend (infinite scroll):**

```typescript
// HomeScreen.tsx
const [currentPage, setCurrentPage] = useState(1);
const [hasMore, setHasMore] = useState(true);
const [loadingMore, setLoadingMore] = useState(false);

const loadProducts = async (page = 1, append = false) => {
  const response = await API.getProducts(
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.maxDlcDate,
    filters.maxDistance,
    userLocation?.latitude,
    userLocation?.longitude,
    page,
    20 // limit
  );

  if (response.success) {
    if (append) {
      setProducts(prev => [...prev, ...response.products]);
    } else {
      setProducts(response.products);
    }

    setHasMore(response.pagination?.hasNextPage || false);
    setCurrentPage(page);
  }
};

const handleLoadMore = () => {
  if (hasMore && !loadingMore && !loading) {
    loadProducts(currentPage + 1, true);
  }
};

// Dans le FlatList
<FlatList
  data={products}
  onEndReached={handleLoadMore}
  onEndReachedThreshold={0.5}
  ListFooterComponent={loadingMore ? <ActivityIndicator /> : null}
/>
```

**Avantages:**
- ⚡ Chargement progressif des produits (20 par page)
- 📱 Expérience utilisateur fluide avec scroll infini
- 🚀 Réduction de la charge serveur et du temps de réponse initial
- 💾 Économie de bande passante mobile

### 10.4 Géolocalisation et Recherche Proximité

**Calcul distance Haversine:**

```sql
-- Fonction PostgreSQL distance entre 2 coordonnées GPS
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL,
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  R DECIMAL := 6371; -- Rayon terre en km
  dLat DECIMAL;
  dLon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dLat := RADIANS(lat2 - lat1);
  dLon := RADIANS(lon2 - lon1);

  a := SIN(dLat/2) * SIN(dLat/2) +
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
       SIN(dLon/2) * SIN(dLon/2);

  c := 2 * ATAN2(SQRT(a), SQRT(1-a));

  RETURN R * c;
END;
$$ LANGUAGE plpgsql;
```

**Frontend géolocalisation:**
```typescript
import * as Location from 'expo-location';

const getUserLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert('Permission refusée', 'Géolocalisation requise');
    return;
  }

  const location = await Location.getCurrentPositionAsync({});
  setUserLocation({
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  });
};
```

**Recherche produits par proximité:**
```typescript
const fetchNearbyProducts = async () => {
  const response = await API.getProducts({
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    radius: 10, // 10km
  });
};
```

### 10.5 Vérification Automatique Disponibilité Panier

**Mécanisme de synchronisation:**

```typescript
// CartScreen.tsx
const checkProductsAvailability = async () => {
  if (cartItems.length === 0) return;

  const unavailableProducts: string[] = [];
  const unavailableNames: string[] = [];

  // Vérifier chaque produit
  for (const item of cartItems) {
    try {
      const response = await API.getProductById(item.id);

      // Vérifier disponibilité ET stock
      if (!response.product ||
          !response.product.is_disponible ||
          response.product.stock <= 0) {
        unavailableProducts.push(item.id);
        unavailableNames.push(item.nom);
      }
    } catch (error) {
      // Produit supprimé = indisponible
      unavailableProducts.push(item.id);
      unavailableNames.push(item.nom);
    }
  }

  // Supprimer produits indisponibles
  if (unavailableProducts.length > 0) {
    removeUnavailableProducts(unavailableProducts);

    Alert.alert(
      'Produits indisponibles',
      `Les produits suivants ne sont plus disponibles et ont été retirés:\n\n${unavailableNames.join('\n')}`
    );
  }
};

// Exécuter à chaque focus écran
useFocusEffect(
  React.useCallback(() => {
    checkProductsAvailability();
  }, [cartItems])
);
```

### 10.6 Nettoyage Automatique Produits Expirés

**Script cron (à implémenter):**

```javascript
// utils/cleanupExpiredProducts.js
const db = require('../config/database');

async function cleanupExpiredProducts() {
  try {
    // Marquer produits expirés comme indisponibles
    const result = await db.query(
      `UPDATE produits
       SET is_disponible = false
       WHERE dlc < CURRENT_DATE
       AND is_disponible = true
       RETURNING id, nom, dlc`
    );

    console.log(`${result.rowCount} produits expirés désactivés`);

    // TODO: Notifier vendeurs

  } catch (error) {
    console.error('Erreur nettoyage produits expirés:', error);
  }
}

// Exécuter quotidiennement à 00:00
setInterval(cleanupExpiredProducts, 24 * 60 * 60 * 1000);

module.exports = { cleanupExpiredProducts };
```

### 10.7 Génération Automatique Numéros Commande

**Trigger PostgreSQL:**

```sql
CREATE SEQUENCE commandes_sequence START 1;

CREATE OR REPLACE FUNCTION generate_numero_commande()
RETURNS TRIGGER AS $$
BEGIN
    NEW.numero_commande := 'CMD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('commandes_sequence')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_numero_commande
BEFORE INSERT ON commandes
FOR EACH ROW
EXECUTE FUNCTION generate_numero_commande();
```

**Format: `CMD-2026-000001`, `CMD-2026-000002`, etc.**

### 10.8 Eco Tips Aléatoires

**Système de sensibilisation écologique:**

```typescript
// utils/ecoTips.ts
export const ECO_TIPS = [
  "En achetant des produits proches de leur DLC, vous réduisez le gaspillage alimentaire !",
  "Chaque produit sauvé est un pas vers un avenir plus durable.",
  "Saviez-vous ? 1/3 de la nourriture mondiale est gaspillée chaque année.",
  "Votre achat aide les commerces locaux à réduire leurs pertes.",
  "Ensemble, luttons contre le gaspillage alimentaire !",
  "Les produits anti-gaspi ont le même goût et la même qualité !",
  "Choisir des produits proches de la DLC, c'est choisir la planète.",
  "Merci de contribuer à un monde plus responsable !",
  "Réduire le gaspillage, c'est préserver notre planète pour les générations futures.",
  "En France, chaque personne jette environ 30kg de nourriture par an.",
];

export const getRandomEcoTip = (): string => {
  return ECO_TIPS[Math.floor(Math.random() * ECO_TIPS.length)];
};
```

**Affichage dans CartScreen, PaymentScreen, AddProductScreen:**
```typescript
const [ecoTip, setEcoTip] = useState('');

useEffect(() => {
  setEcoTip(getRandomEcoTip());
}, []);

<View style={styles.ecoTipContainer}>
  <Text style={styles.ecoTipText}>{ecoTip}</Text>
</View>
```

### 10.9 Gestion Stock en Temps Réel

**Workflow complet:**

1. **Ajout produit (vendeur):**
```typescript
// Frontend
await API.addProduct({ ..., stock: 10 });

// Backend
INSERT INTO produits (..., stock) VALUES (..., $8);
```

2. **Affichage stock:**
```typescript
<Text>Stock disponible: {product.stock}</Text>

{product.stock <= 3 && (
  <Text style={styles.lowStock}>Stock limité !</Text>
)}
```

3. **Sélection quantité panier:**
```typescript
const updateQuantity = (productId: string, quantity: number) => {
  setCartItems(prevItems =>
    prevItems.map(item =>
      item.id === productId
        ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) }
        : item
    )
  );
};

// Limite: min=1, max=stock
```

4. **Paiement - décrémentation stock:**
```javascript
// Backend - routes/payment.js
for (const item of items) {
  // Vérifier stock disponible
  const productCheck = await db.query(
    'SELECT stock FROM produits WHERE id = $1',
    [item.product_id]
  );

  if (productCheck.rows[0].stock < item.quantity) {
    return res.status(400).json({
      success: false,
      message: `Stock insuffisant pour ${item.nom}`
    });
  }

  // Décrémenter stock
  await db.query(
    'UPDATE produits SET stock = stock - $1 WHERE id = $2',
    [item.quantity, item.product_id]
  );

  // Si stock = 0, marquer indisponible
  await db.query(
    `UPDATE produits
     SET is_disponible = false
     WHERE id = $1 AND stock <= 0`,
    [item.product_id]
  );
}
```

5. **Vérification panier (automatique):**
```typescript
// Voir section 10.4
checkProductsAvailability(); // Appelé au focus écran
```

---

## 11. GESTION DES PAIEMENTS

### 11.1 Intégration Stripe

**Architecture:**
```
Mobile App (Stripe SDK) ←→ Backend (Stripe API) ←→ Stripe Servers
```

**Configuration:**

```typescript
// App.tsx
import { StripeProvider } from '@stripe/stripe-react-native';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51Sk4BD3AH8r0pLWd...';

<StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
  <App />
</StripeProvider>
```

```javascript
// Backend
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

### 11.2 Flux de Paiement

**1. Création Payment Intent (Backend):**

```javascript
// POST /api/payment/create-payment-intent
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body;

    // Calculer montant total
    let totalAmount = 0;
    for (const item of items) {
      const productResult = await db.query(
        'SELECT prix, stock FROM produits WHERE id = $1',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Produit introuvable' });
      }

      const product = productResult.rows[0];

      // Vérifier stock
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant pour ${item.nom}`
        });
      }

      totalAmount += parseFloat(product.prix) * item.quantity;
    }

    // Créer Payment Intent Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // En centimes
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: req.user.userId,
        itemCount: items.length,
      },
    });

    res.json({
      success: true,
      paymentIntent: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    console.error('Erreur création Payment Intent:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});
```

**2. Confirmation Paiement (Frontend):**

```typescript
// PaymentScreen.tsx
import { CardField, useStripe } from '@stripe/stripe-react-native';

const { confirmPayment } = useStripe();

const handlePayment = async () => {
  setLoading(true);

  try {
    // 1. Créer Payment Intent
    const response = await API.createPaymentIntent(
      cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity || 1,
        nom: item.nom,
      }))
    );

    const { clientSecret } = response;

    // 2. Confirmer paiement avec Stripe SDK
    const { error, paymentIntent } = await confirmPayment(clientSecret, {
      paymentMethodType: 'Card',
      paymentMethodData: {
        billingDetails: {
          email: userEmail,
        },
      },
    });

    if (error) {
      Alert.alert('Erreur de paiement', error.message);
      setLoading(false);
      return;
    }

    // 3. Confirmer côté backend (création commande)
    await API.confirmPayment(
      paymentIntent.id,
      cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity || 1,
        prix_unitaire: parseFloat(item.prix),
      }))
    );

    // 4. Vider panier et rediriger
    clearCart();
    Alert.alert('Paiement réussi', 'Votre commande a été confirmée !');
    navigation.navigate('Orders');

  } catch (error) {
    console.error('Erreur paiement:', error);
    Alert.alert('Erreur', 'Une erreur est survenue lors du paiement');
  } finally {
    setLoading(false);
  }
};

// UI CardField
<CardField
  postalCodeEnabled={false}
  placeholders={{
    number: '4242 4242 4242 4242',
  }}
  cardStyle={{
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
  }}
  style={{ width: '100%', height: 50 }}
  onCardChange={(cardDetails) => {
    setCardComplete(cardDetails.complete);
  }}
/>
```

**3. Confirmation Backend & Création Commande:**

```javascript
// POST /api/payment/confirm
router.post('/confirm', authenticateToken, async (req, res) => {
  const client = await db.connect();

  try {
    const { paymentIntentId, items } = req.body;

    // Vérifier Payment Intent avec Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Paiement non confirmé'
      });
    }

    // Transaction BEGIN
    await client.query('BEGIN');

    // Grouper items par commerce
    const itemsByCommerce = {};

    for (const item of items) {
      const productResult = await client.query(
        'SELECT commerce_id, stock FROM produits WHERE id = $1',
        [item.product_id]
      );

      const product = productResult.rows[0];
      const commerceId = product.commerce_id;

      // Vérifier stock
      if (product.stock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant pour le produit ${item.product_id}`
        });
      }

      if (!itemsByCommerce[commerceId]) {
        itemsByCommerce[commerceId] = [];
      }
      itemsByCommerce[commerceId].push(item);
    }

    // Créer une commande par commerce
    const commandes = [];

    for (const [commerceId, commerceItems] of Object.entries(itemsByCommerce)) {
      // Calculer total pour ce commerce
      const total = commerceItems.reduce((sum, item) =>
        sum + (item.prix_unitaire * item.quantity), 0
      );

      // Créer commande
      const commandeResult = await client.query(
        `INSERT INTO commandes
         (client_id, commerce_id, total, statut, stripe_payment_intent_id, stripe_payment_status, paid_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [req.user.userId, commerceId, total, 'confirmee', paymentIntentId, 'succeeded']
      );

      const commande = commandeResult.rows[0];
      commandes.push(commande);

      // Créer commande_items et décrémenter stock
      for (const item of commerceItems) {
        // Insérer item
        await client.query(
          `INSERT INTO commande_items (commande_id, product_id, quantite, prix_unitaire)
           VALUES ($1, $2, $3, $4)`,
          [commande.id, item.product_id, item.quantity, item.prix_unitaire]
        );

        // Décrémenter stock
        await client.query(
          'UPDATE produits SET stock = stock - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );

        // Si stock = 0, désactiver produit
        await client.query(
          `UPDATE produits
           SET is_disponible = false
           WHERE id = $1 AND stock <= 0`,
          [item.product_id]
        );
      }
    }

    // Transaction COMMIT
    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Paiement confirmé et commande créée',
      commandes,
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur confirmation paiement:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  } finally {
    client.release();
  }
});
```

### 11.3 Carte de test Stripe

```
Numéro: 4242 4242 4242 4242
Date expiration: N'importe quelle date future (ex: 12/34)
CVC: N'importe quel 3 chiffres (ex: 123)
Code postal: N'importe quel (ex: 75001)
```

### 11.4 Sécurité Paiements

✅ **PCI DSS Compliance**
- Stripe gère les données carte bancaire
- Frontend ne traite jamais les données brutes
- Tokenization automatique par Stripe SDK

✅ **3D Secure**
- Activé automatiquement par Stripe
- Gestion authentification forte

✅ **Webhooks Stripe (à implémenter)**
```javascript
// Écouter événements Stripe
app.post('/api/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        // Confirmer commande
        break;
      case 'payment_intent.payment_failed':
        // Notifier échec
        break;
    }

    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

---

## 12. SYSTÈME DE GÉOLOCALISATION

### 12.1 Géocodage Adresses (OpenStreetMap Nominatim)

**Composant AddressAutocomplete:**

```typescript
const searchAddress = async (query: string) => {
  setLoading(true);
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}&` +
      `format=json&` +
      `addressdetails=1&` +
      `limit=5&` +
      `countrycodes=fr`,
      {
        headers: {
          'User-Agent': 'EcoStock-App',  // Requis par OSM
        },
      }
    );

    const data = await response.json();
    setSuggestions(data);
    setShowSuggestions(data.length > 0);
  } catch (error) {
    console.error('Address search error:', error);
    setSuggestions([]);
  } finally {
    setLoading(false);
  }
};

const selectSuggestion = (suggestion: AddressSuggestion) => {
  const formattedAddress = suggestion.display_name;
  onSelectAddress(formattedAddress, suggestion.lat, suggestion.lon);
  // Callback vers parent avec coordonnées GPS
};
```

**Stockage coordonnées:**
```javascript
// Backend - Inscription vendeur
INSERT INTO commerces (vendeur_id, nom_commerce, adresse, latitude, longitude)
VALUES ($1, $2, $3, $4, $5);
```

### 12.2 Affichage Carte Interactive

**React Native Maps:**

```typescript
import MapView, { Marker } from 'react-native-maps';

<MapView
  style={styles.map}
  initialRegion={{
    latitude: parseFloat(commerce.latitude),
    longitude: parseFloat(commerce.longitude),
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }}
>
  <Marker
    coordinate={{
      latitude: parseFloat(commerce.latitude),
      longitude: parseFloat(commerce.longitude),
    }}
    title={commerce.nom_commerce}
    description={commerce.adresse}
  />

  {/* Marqueur position utilisateur */}
  {userLocation && (
    <Marker
      coordinate={userLocation}
      title="Votre position"
      pinColor="blue"
    />
  )}
</MapView>
```

### 12.3 Recherche par Proximité

**Backend - Calcul distance:**

```javascript
// GET /api/products?latitude=48.8566&longitude=2.3522&radius=10
router.get('/', async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;

    let query = `
      SELECT
        p.*,
        c.nom_commerce,
        c.latitude AS commerce_latitude,
        c.longitude AS commerce_longitude,
        cat.nom AS category_name
      FROM produits p
      JOIN commerces c ON p.commerce_id = c.id
      LEFT JOIN categories cat ON p.category_id = cat.id
      WHERE p.is_disponible = true
    `;

    const params = [];

    if (latitude && longitude && radius) {
      // Formule Haversine
      query += ` AND (
        6371 * ACOS(
          COS(RADIANS($${params.length + 1})) *
          COS(RADIANS(c.latitude)) *
          COS(RADIANS(c.longitude) - RADIANS($${params.length + 2})) +
          SIN(RADIANS($${params.length + 1})) *
          SIN(RADIANS(c.latitude))
        )
      ) <= $${params.length + 3}`;

      params.push(latitude, longitude, radius);
    }

    query += ' ORDER BY p.dlc ASC';

    const result = await db.query(query, params);

    res.json({
      success: true,
      products: result.rows,
    });

  } catch (error) {
    console.error('Erreur récupération produits:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});
```

**Frontend - Activation géolocalisation:**

```typescript
import * as Location from 'expo-location';

const enableLocationSearch = async () => {
  // Demander permission
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Permission refusée',
      'La géolocalisation est nécessaire pour trouver les produits près de vous.'
    );
    return;
  }

  // Obtenir position
  setLoadingLocation(true);
  const location = await Location.getCurrentPositionAsync({});

  setUserLocation({
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  });

  // Rechercher produits proches
  await fetchNearbyProducts(
    location.coords.latitude,
    location.coords.longitude,
    10 // 10km radius
  );

  setLoadingLocation(false);
};
```

### 12.4 Calcul Distance & Affichage

```typescript
// Fonction calcul distance (Haversine)
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Rayon terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance en km
};

// Affichage sur ProductCard
const distance = calculateDistance(
  userLocation.latitude,
  userLocation.longitude,
  product.commerce_latitude,
  product.commerce_longitude
);

<Text>📍 À {distance.toFixed(1)} km</Text>
```

---

## 13. WORKFLOWS ET FLUX UTILISATEUR

### 13.1 Parcours Client

```
1. INSCRIPTION/CONNEXION
   LoginScreen → API /auth/login → Token SecureStore → MainTabNavigator

2. NAVIGATION HOME
   HomeScreen → Fetch products → Display ProductCards

3. RECHERCHE PRODUIT
   - Par catégorie: FilterModal
   - Par proximité: Géolocalisation
   - Par recherche: Barre de recherche

4. DÉTAIL PRODUIT
   ProductCard (press) → ProductDetailScreen
   - Voir détails
   - Sélectionner quantité
   - Ajouter au panier → CartContext.addToCart()

5. PANIER
   Cart icon (badge) → CartScreen
   - Voir produits
   - Modifier quantités
   - Voir recettes suggérées
   - Vérification automatique disponibilité (useFocusEffect)

6. PAIEMENT
   "Passer au paiement" → PaymentScreen
   - Saisir carte (CardField)
   - Créer Payment Intent
   - Confirmer paiement Stripe
   - Confirmer commande backend
   - Décrémentation stock
   - Vider panier
   → Navigation OrdersScreen

7. SUIVI COMMANDES
   ProfileScreen → "Mes commandes" → OrdersScreen
   - Liste commandes
   - Détails: produits, statut, numéro commande
   - Carte avec localisation commerce
   - Horaires retrait
```

### 13.2 Parcours Vendeur

```
1. INSCRIPTION VENDEUR
   SignupScreen → user_type: 'vendeur'
   - Nom commerce (requis)
   - Adresse commerce (requis avec géocodage)
   → Création users + commerces

2. AJOUT PRODUIT
   ProfileScreen → "Mes produits" → SellerProductsScreen → "Ajouter produit"
   → AddProductScreen
   - Saisir infos produit
   - Upload image (expo-image-picker)
   - Sélectionner catégorie
   - Définir stock
   - Choisir DLC (DateTimePicker)
   - Ajouter ingrédients (IngredientAutocomplete)
   - Définir horaires retrait
   → API /seller/products (POST)

3. GESTION PRODUITS
   SellerProductsScreen
   - Liste mes produits
   - Badges: stock, disponibilité
   - Actions:
     * Modifier → AddProductScreen (mode édition)
     * Supprimer → Confirmation → API DELETE
     * Activer/Désactiver → Toggle is_disponible

4. GESTION COMMANDES
   ProfileScreen → "Commandes reçues" → SellerOrdersScreen
   - Liste commandes
   - Filtrage par statut
   - Détails: client, produits, montant
   - Actions:
     * Confirmer commande → statut: 'confirmee'
     * Marquer prête → statut: 'prete'
     * Marquer récupérée → statut: 'recuperee'
     * Annuler → statut: 'annulee'
   → API /seller/orders/:id/status (PUT)
```

### 13.3 Système de Recettes

```
1. ACCÈS RECETTES
   Méthode A: CartScreen → "Voir les recettes"
   - Passe ingredient_ids du panier

   Méthode B: SearchScreen → "Rechercher par ingrédients"
   - Autocomplete ingrédients
   - Sélection multiple

   → RecipesScreen

2. LISTE RECETTES
   RecipesScreen
   - Affiche recettes matchant ingrédients
   - Score correspondance (%)
   - Filtres: difficulté, temps préparation

3. DÉTAIL RECETTE
   RecipeCard (press) → RecipeDetailScreen
   - Image
   - Description
   - Liste ingrédients avec quantités
   - Indicateur: disponible dans panier (✓ vert)
   - Instructions étape par étape
   - Temps préparation, difficulté
```

### 13.4 Gestion Profil

```
1. AFFICHAGE PROFIL
   ProfileTab → ProfileScreen
   - Infos utilisateur
   - Type compte
   - Menu navigation:
     * Informations personnelles
     * Mes commandes
     * Moyens de paiement
     * [Si vendeur] Mes produits
     * [Si vendeur] Commandes reçues
     * Déconnexion

2. MODIFICATION INFOS
   "Informations personnelles" → PersonalInfoScreen
   - Email (obligatoire)
   - Prénom, nom (optionnels - RGPD)
   - Téléphone (optionnel)
   - Adresse personnelle (optionnelle)
   - [Si vendeur] Nom commerce, adresse commerce
   - [Si association] Nom association
   → API /profile (PUT)

3. DÉCONNEXION
   "Déconnexion" → Confirmation Alert
   - Supprimer token SecureStore
   - Navigation → AuthNavigator (LoginScreen)
```

---

## 14. TESTS ET DEBUGGING

### 14.1 Stratégies de Test

**Tests manuels:**
✅ Tests fonctionnels écrans
✅ Tests flux utilisateur complets
✅ Tests paiement Stripe (mode test)
✅ Tests géolocalisation (simulateur + device)

**Tests automatisés implémentés:**
✅ **167 tests unitaires Jest** (100% de réussite)
- **Utils tests:** Validations formulaires, ecoTips, helpers panier, recettes, géolocalisation, authentification
- **Services tests:** Logique API (pagination, URL construction, formatage)
- **Business logic:** Calculs prix, stock, économies, filtres, distance, matching recettes
- **Configuration:** ts-jest avec TypeScript

**Structure des tests:**
```
Eco_Front/
  __tests__/
    utils/
      - validations.test.ts (32 tests - validations formulaires)
      - ecoTips.test.ts (9 tests - conseils écologiques)
      - cart-helpers.test.ts (26 tests - logique panier)
      - recipes-helpers.test.ts (22 tests - filtrage & matching recettes)
      - geolocation-helpers.test.ts (20 tests - calculs distance Haversine)
      - auth-helpers.test.ts (24 tests - JWT, passwords, sessions)
    services/
      - api.test.ts (5 tests - calculs & distance)
      - api-functions.test.ts (17 tests - API & formatage)
      - pagination.test.ts (25 tests - pagination & infinite scroll)
  jest.config.js
  jest.setup.simple.js
```

**Couverture des tests:**
- ✅ Validation des entrées utilisateur (email, téléphone, mot de passe, prix, stock)
- ✅ Calculs financiers (totaux, réductions, économies)
- ✅ Gestion du stock et quantités
- ✅ Filtres et recherche (prix, DLC, disponibilité, recettes)
- ✅ Formatage des données (dates, prix, URL)
- ✅ Logique métier du panier
- ✅ Conseils écologiques
- ✅ Matching et scoring des recettes par ingrédients
- ✅ Calculs de distance géographique (formule de Haversine)
- ✅ Tri des commerces par proximité
- ✅ Validation JWT et gestion de sessions
- ✅ Validation des mots de passe (force, confirmation)
- ✅ Pagination (métadonnées, offset, navigation)
- ✅ Infinite scroll (déclenchement, prévention duplicatas)

**Commandes de test Frontend:**
```bash
cd Eco_Front
npm test              # Lancer tous les tests
npm test:watch        # Mode watch
npm test:coverage     # Rapport de couverture
```

**Commandes de test Backend:**
```bash
cd ecostock_backend
npm test              # Lancer tous les tests
npm test:watch        # Mode watch
npm test:coverage     # Rapport de couverture
```

---

### 14.2 Tests Backend (83 tests)

**Tests automatisés implémentés:**
✅ **83 tests unitaires Jest** (100% de réussite)
- **Routes d'authentification:** 41 tests (register, login, change-password)
- **Middleware d'authentification:** 29 tests (validation JWT, sécurité)
- **Logique métier:** 13 tests (prix, stock, disponibilité, calculs)

**Structure des tests:**
```
ecostock_backend/
  __tests__/
    routes/
      - auth.test.js (41 tests - register, login, change-password)
    middleware/
      - auth.test.js (29 tests - JWT validation, security)
    utils/
      - business-logic.test.js (13 tests - business rules)
  jest.config.js
```

**Couverture des tests backend:**
- ✅ Inscription (acheteur, vendeur, association)
- ✅ Validation des données d'inscription (email unique, champs requis)
- ✅ Connexion avec credentials
- ✅ Gestion des comptes inactifs
- ✅ Changement de mot de passe sécurisé
- ✅ Validation JWT (tokens valides, expirés, invalides)
- ✅ Vérification signature JWT
- ✅ Hachage bcrypt des mots de passe
- ✅ Requêtes base de données (utilisateurs actifs uniquement)
- ✅ Calculs de prix et réductions
- ✅ Gestion du stock (disponibilité, out of stock)
- ✅ Validation des dates de péremption (DLC)
- ✅ Pagination (offset, total pages, navigation)
- ✅ Calculs de commandes (totaux, économies)
- ✅ Filtres et recherche
- ✅ Calculs de distance géographique

**Tests à implémenter:**
- **Integration tests:** Tests complets des routes API
- **E2E tests:** Detox pour React Native
- **Component tests:** Tests des composants React avec React Testing Library

### 14.2 Logging

**Backend:**
```javascript
// Logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Logs erreurs
console.error('Erreur:', error);
```

**Frontend:**
```typescript
console.log('[App] Starting application');
console.log('[CartScreen] Checking product availability');
console.error('Erreur chargement produits:', error);
```

### 14.3 Gestion Erreurs

**Backend:**
```javascript
// Gestion erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(500).json({
    success: false,
    message: 'Erreur serveur'
  });
});

// Try/catch sur routes
try {
  // Logic
} catch (error) {
  console.error('Erreur route:', error);
  res.status(500).json({ success: false, message: 'Erreur serveur' });
}
```

**Frontend:**
```typescript
try {
  const response = await API.getProducts();
  setProducts(response.products);
} catch (error) {
  console.error('Erreur:', error);
  Alert.alert('Erreur', 'Impossible de charger les produits');
}
```

### 14.4 Debugging React Native

**React DevTools:**
```bash
npm install -g react-devtools
react-devtools
```

**Expo DevTools:**
- Ouvrir dans navigateur après `expo start`
- Inspect éléments
- Logs console
- Performance monitor

**Flipper (avancé):**
- Debugger natif
- Network inspector
- Redux DevTools
- Layout inspector

### 14.5 Commandes Utiles

```bash
# Frontend
cd Eco_Front
npm start              # Lancer Expo
npm run android        # Lancer sur Android
npm run ios            # Lancer sur iOS

# Backend
cd ecostock_backend
npm start              # Lancer serveur (node)
npm run dev            # Lancer avec nodemon (auto-reload)

# Database
psql -U postgres -d ecostock_db    # Connexion PostgreSQL
\dt                                # Lister tables
\d users                           # Décrire table users
SELECT * FROM produits LIMIT 10;   # Requête test
```

---

## 15. DÉPLOIEMENT

### 15.1 Environnements

**Développement:**
- Backend: `localhost:3000`
- Database: PostgreSQL local
- Stripe: Mode test
- Expo: Development build

**Production (à configurer):**
- Backend: Serveur cloud (Heroku, AWS, DigitalOcean)
- Database: PostgreSQL managé (AWS RDS, Heroku Postgres)
- Stripe: Mode production
- App: Build production (EAS Build)

### 15.2 Build Production App Mobile

**Expo Application Services (EAS):**

```bash
# Installer EAS CLI
npm install -g eas-cli

# Login Expo
eas login

# Configurer projet
eas build:configure

# Build Android APK
eas build --platform android --profile production

# Build iOS
eas build --platform ios --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

**Configuration `eas.json`:**
```json
{
  "build": {
    "production": {
      "node": "18.x.x",
      "env": {
        "API_URL": "https://api.ecostock.com"
      },
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "bundleIdentifier": "com.ecostock.app"
      }
    }
  }
}
```

### 15.3 Déploiement Backend

**Heroku (exemple):**

```bash
# Installer Heroku CLI
npm install -g heroku

# Login
heroku login

# Créer app
heroku create ecostock-api

# Ajouter PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Configurer variables environnement
heroku config:set JWT_SECRET=your-secret
heroku config:set STRIPE_SECRET_KEY=sk_live_...

# Déployer
git push heroku main

# Migrations database
heroku pg:psql < backup.sql
```

**Configuration production `server.js`:**
```javascript
const PORT = process.env.PORT || 3000;

// CORS production
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://app.ecostock.com',
  credentials: true
}));

// HTTPS redirect
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### 15.4 Checklist Pré-Production

**Sécurité:**
- [ ] Changer `JWT_SECRET` en valeur forte aléatoire
- [ ] Activer HTTPS sur backend
- [ ] Restreindre CORS aux domaines autorisés
- [ ] Vérifier toutes les variables `.env`
- [ ] Activer mode production Stripe
- [ ] Audit dépendances npm (`npm audit`)

**Performance:**
- [ ] Activer compression gzip
- [ ] Optimiser images (WebP, lazy loading)
- [ ] Implémenter pagination API
- [ ] Ajouter cache (Redis)
- [ ] Minifier code frontend

**Monitoring:**
- [ ] Configurer logs centralisés (Sentry, LogRocket)
- [ ] Mettre en place alertes erreurs
- [ ] Monitoring performance (New Relic)
- [ ] Tracking analytics (Google Analytics, Mixpanel)

**Base de données:**
- [ ] Backups automatiques quotidiens
- [ ] Index sur colonnes fréquentes
- [ ] Nettoyage produits expirés (cron job)
- [ ] Connection pooling configuré

**Legal:**
- [ ] CGU/CGV
- [ ] Politique de confidentialité (RGPD)
- [ ] Mentions légales
- [ ] Consentement cookies

---

## CONCLUSION

Ce document couvre l'intégralité de l'architecture technique du projet **Eco_Stock**.

**Points forts du projet:**
- Architecture 3-tiers bien structurée
- Sécurité robuste (JWT, bcrypt, requêtes paramétrées)
- RGPD compliant
- Paiements sécurisés Stripe
- Géolocalisation et recherche proximité
- Système intelligent de matching recettes
- Gestion stock temps réel
- Mécanismes anti-gaspillage (vérification panier, eco tips)
- Code TypeScript typé
- Séparation des préoccupations

**Axes d'amélioration:**
- Tests automatisés (Jest, Detox)
- Pagination API
- Cache Redis
- Notifications push (commandes, DLC proche)
- Statistiques vendeurs (dashboard)
- Système de notation/avis

**Technologies maîtrisées:**
- React Native + Expo
- TypeScript
- React Navigation
- Context API
- Node.js + Express
- PostgreSQL (SQL avancé: triggers, vues, fonctions)
- Stripe API
- Géolocalisation & Maps
- JWT Authentication
- REST API design

---

**Document généré le:** 2026-01-07
**Version:** 1.0.0
**Projet:** Eco_Stock - Marketplace Anti-Gaspillage
