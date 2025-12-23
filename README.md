# EcoStock - Plateforme Anti-Gaspillage

Application mobile permettant aux commerçants de vendre leurs invendus à prix réduit, aux associations de récupérer des produits, et aux clients d'acheter pas chère
.

---

## Fonctionnalités Implémentées

### Authentification
- Inscription avec 3 types d'utilisateurs (Client, Vendeur, Association)
- Connexion sécurisée avec JWT (90 jours)
- Mot de passe oublié
- Déconnexion
- Options de connexion sociale (Facebook, Google, Apple) - interface prête

### Gestion de Profil
- Affichage du profil utilisateur avec photo
- Upload de photo de profil (base64)
- Modification des informations personnelles:
  - Nom, prénom, email
  - Numéro de téléphone (validation format français)
  - Adresse complète (ligne 1, ligne 2, code postal, ville, pays)
  - Nom du commerce (pour vendeurs)
  - Nom de l'association (pour associations)
- Validation des formulaires (email, téléphone, code postal)

### Méthodes de Paiement
- Ajout de cartes bancaires (Visa, Mastercard)
- Support Apple Pay et Google Pay
- Validation des cartes:
  - Numéro de carte (13-19 chiffres)
  - Date d'expiration (MM/YY avec vérification future)
  - CVV (3-4 chiffres)
- Formatage automatique des champs
- Suppression de méthodes de paiement
- Stockage local sécurisé

### Fonctionnalités Vendeur
- Autocomplétion d'adresse avec OpenStreetMap Nominatim
- Validation obligatoire de l'adresse du commerce
- Récupération automatique des coordonnées GPS (latitude/longitude)
- Table `commerces` séparée en base de données
- Modification de l'adresse du commerce dans le profil

### Interface Utilisateur
- Écran de démarrage avec logo animé
- Navigation inférieure avec 5 onglets (Accueil, Recherche, Panier, Recettes, Profil)
- Design moderne et responsive
- Messages écologiques aléatoires (20 messages différents)
- Indicateurs visuels de validation
- Thème vert cohérent (#166534)
- Loading states avec messages écologiques

### Composants Réutilisables
- AddressAutocomplete (recherche d'adresse avec validation)
- BottomNavBar (navigation avec icônes SVG)
- EcoTip (messages de sensibilisation écologique)
- SocialIcons (Facebook, Google, Apple)
- Composants de base (Button, Input, AuthHeader)

### Base de Données
- Table `users` avec tous les champs profil
- Table `commerces` avec coordonnées GPS pour les vendeurs
- Transactions SQL pour garantir l'intégrité
- Gestion des images en base64

### Backend API
- POST /api/auth/register - Inscription
- POST /api/auth/login - Connexion
- GET /api/auth/verify - Vérification du token
- GET /api/profile - Récupération du profil
- PUT /api/profile - Mise à jour du profil
- POST /api/profile/upload-image - Upload d'image
- Middleware d'authentification JWT
- Gestion des sessions expirées
- Validation des données côté serveur

### Sécurité
- Hachage des mots de passe avec bcryptjs
- Tokens JWT avec expiration
- Vérification de l'état actif du compte
- Validation des emails uniques
- CORS configuré pour l'application mobile

---

## Installation rapide

### 1. Base de données PostgreSQL

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base
CREATE DATABASE ecostock;
\c ecostock

# Exécuter les scripts
\i ecostock_backend/database_backup.sql
\i Eco_Front/src/schema_updates.sql
```

### 2. Backend

```bash
cd ecostock_backend
npm install

# Créer le fichier .env avec:
DB_USER=postgres
DB_HOST=localhost
DB_NAME=ecostock
DB_PASSWORD=votre_mot_de_passe
DB_PORT=5432
JWT_SECRET=votre_secret_jwt_tres_securise_minimum_32_caracteres
JWT_EXPIRES_IN=90d
PORT=3000
NODE_ENV=development

# Démarrer
npm start
```

### 3. Frontend

```bash
cd Eco_Front
npm install

# Modifier l'URL dans src/services/api.ts
# Remplacer par votre IP locale (trouver avec: ipconfig)
const API_URL = 'http://VOTRE_IP:3000/api';

# Démarrer
npx expo start
```

Scanner le QR code avec Expo Go

---

## Technologies

### Frontend
- React Native avec Expo (v54.0.12)
- TypeScript (v5.9.2)
- OpenStreetMap Nominatim API

### Backend
- Node.js avec Express.js
- PostgreSQL
- JWT pour l'authentification
- Transactions SQL

---

## Structure

```
Eco_Stock/
├── Eco_Front/
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   └── theme/
│   ├── schema_updates.sql
│   └── package.json
└── ecostock_backend/
    ├── config/
    ├── routes/
    ├── middleware/
    ├── database_backup.sql
    └── package.json
```

---

## Informations importantes

### Fichier .env obligatoire
Le backend ne démarrera pas sans le fichier `.env` dans `ecostock_backend/`

### Adresse IP
Dans `src/services/api.ts`, remplacer l'IP par celle de votre machine (obtenir avec `ipconfig`)

### Validation d'adresse
Les vendeurs doivent obligatoirement sélectionner une adresse validée depuis les suggestions OpenStreetMap

---

Fait pour réduire le gaspillage alimentaire
