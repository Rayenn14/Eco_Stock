# EcoStock

Application mobile pour réduire le gaspillage alimentaire.

## C'est quoi ?

EcoStock permet aux commerçants de vendre leurs produits proches de la date de péremption à prix réduit. Les clients et associations peuvent acheter ces produits pour éviter qu'ils soient jetés.

## Comment ça marche ?

- **Vendeurs** : mettent en ligne leurs produits invendus avec une réduction
- **Clients** : achètent des produits pas chers
- **Associations** : récupèrent des produits réservés pour elles

## Technologies utilisées

- **Frontend** : React Native avec Expo
- **Backend** : Node.js avec Express
- **Base de données** : PostgreSQL
- **Paiement** : Stripe
- **Images** : Cloudinary

## Installation

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd Eco_Stock
```

### 2. Installer les dépendances

```bash
# Backend
cd ecostock_backend
npm install

# Frontend
cd ../Eco_Front
npm install
```

### 3. Configurer le backend

Créer un fichier `.env` dans `ecostock_backend/` avec :

```
DB_USER=postgres
DB_PASSWORD=ton_mot_de_passe
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecostock
JWT_SECRET=une_cle_secrete
STRIPE_SECRET_KEY=ta_cle_stripe
CLOUDINARY_CLOUD_NAME=ton_cloud
CLOUDINARY_API_KEY=ta_cle
CLOUDINARY_API_SECRET=ton_secret
```

### 4. Créer la base de données

```bash
psql -U postgres
CREATE DATABASE ecostock;
\q

psql -U postgres -d ecostock -f ecostock_backend/Bd.sql
```

## Lancer le projet

### Backend

```bash
cd ecostock_backend
npm start
```

### Frontend (avec tunnel pour tester sur téléphone)

```bash
cd Eco_Front
npx expo start --tunnel
```

Scanner le QR code avec l'app Expo Go sur ton téléphone.


## Fonctionnalités principales

### Authentification
- Inscription avec 3 types de compte : client, vendeur, association
- Connexion avec email/mot de passe
- Token JWT stocké de façon sécurisée
- Déconnexion

### Pour les clients
- Voir le catalogue de produits disponibles
- Rechercher des produits par nom, catégorie, ingrédient
- Filtrer par catégorie
- Voir les détails d'un produit (prix, DLC, vendeur, localisation)
- Ajouter au panier
- Payer avec Stripe
- Voir l'historique des commandes
- Recevoir des suggestions de recettes basées sur ses achats

### Pour les vendeurs
- Ajouter un produit (nom, prix, prix original, stock, DLC, photo)
- Voir la liste de ses produits
- Supprimer un produit
- Voir les commandes reçues
- Définir des horaires de retrait
- Réserver des produits pour les associations

### Pour les associations
- Accès aux produits réservés aux associations
- Mêmes fonctionnalités que les clients

### Recettes
- Catalogue de recettes
- Recherche par nom ou ingrédient
- Suggestions basées sur les ingrédients achetés
- Détail avec instructions et ingrédients

### Autres
- Upload d'images vers Cloudinary
- Géolocalisation des commerces
- Expiration automatique des produits après l'heure de retrait
- Notifications de produits proches de la DLC

## Commandes utiles pour le dev

### Base de données

```bash
# Lancer PostgreSQL
psql -U postgres

# Se connecter à la base ecostock
psql -U postgres -d ecostock

# Voir toutes les tables
\dt

# Voir la structure d'une table
\d products

# Exporter la base
pg_dump -U postgres -d ecostock > backup.sql

# Importer une base
psql -U postgres -d ecostock -f backup.sql
```

### Backend

```bash
cd ecostock_backend

# Lancer le serveur
npm start

# Lancer avec auto-reload (nodemon)
npm run dev

# Lancer les tests
npm test
```

### Frontend

```bash
cd Eco_Front

# Lancer en local (même réseau wifi)
npx expo start

# Lancer avec tunnel (fonctionne partout)
npx expo start --tunnel

# Vider le cache si bug
npx expo start --clear
```

### ngrok (pour exposer le backend sur internet)

```bash
# Lancer ngrok sur le port 3000
ngrok http 3000

# Copier l'URL https://xxxx.ngrok.io et la mettre dans api.ts
```

### Git

```bash
# Voir l'état des fichiers
git status

# Ajouter tous les fichiers modifiés
git add .

# Créer un commit
git commit -m "message"

# Envoyer sur GitHub
git push

# Récupérer les changements
git pull
```

## Endpoints API principaux

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/auth/register` | POST | Créer un compte |
| `/api/auth/login` | POST | Se connecter |
| `/api/products` | GET | Liste des produits |
| `/api/products/:id` | GET | Détail d'un produit |
| `/api/seller/products` | POST | Ajouter un produit (vendeur) |
| `/api/seller/my-products` | GET | Mes produits (vendeur) |
| `/api/cart` | GET/POST/DELETE | Gérer le panier |
| `/api/orders` | GET/POST | Commandes |
| `/api/recipes` | GET | Liste des recettes |
| `/api/recipes/suggestions` | GET | Recettes selon ingrédients |

## Comptes de test

Tu peux créer un compte directement dans l'app ou utiliser la base de données pour en créer un.
