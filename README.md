# ♻️ EcoStock - Application de Lutte contre le Gaspillage Alimentaire

**EcoStock** est une application mobile Full-Stack innovante conçue pour réduire le gaspillage alimentaire. Elle connecte les commerçants disposant de produits proches de la date de péremption avec des clients et des associations, permettant ainsi de revaloriser ces invendus à prix réduit.

---

## 🎯 Concept et Utilisateurs

L'écosystème repose sur trois types d'acteurs :
* 🏪 **Vendeurs (Commerçants)** : Mettent en ligne leurs invendus avec une réduction, définissent des horaires de retrait et peuvent réserver des lots pour les associations.
* 🛒 **Clients** : Parcourent le catalogue, achètent des produits à prix cassé et découvrent des recettes basées sur leurs achats.
* 🤝 **Associations** : Bénéficient d'un accès exclusif à des produits qui leur sont spécialement réservés pour la redistribution solidaire.

---

## 🛠 Stack Technique

L'application repose sur une architecture moderne et robuste :

* **Frontend** : React Native (avec Expo)
* **Backend** : Node.js avec Express.js
* **Base de données** : PostgreSQL
* **Paiement sécurisé** : API Stripe
* **Gestion des médias** : API Cloudinary
* **Sécurité & Qualité** : SonarQube, OWASP ZAP

---

## 🚀 Fonctionnalités Principales

### 🔐 Authentification & Sécurité
* Inscription et connexion par rôle (Client, Vendeur, Association).
* Sécurisation des sessions via **Token JWT** (stockage sécurisé).
* Hashage des mots de passe avec **bcrypt**.

### 🛍️ Espace Client & Association
* **Catalogue interactif** : Recherche (nom, ingrédient) et filtrage par catégorie.
* **Détails produits** : Affichage du prix remisé, DLC, vendeur et géolocalisation.
* **Panier & Achat** : Intégration fluide du paiement par carte via **Stripe**.
* **Suivi** : Historique complet des commandes.

### 🏪 Espace Vendeur
* **Gestion du stock** : Ajout/Suppression de produits (nom, prix initial, prix réduit, stock, DLC, photo via Cloudinary).
* **Logistique** : Définition des horaires de retrait en magasin.
* **Gestion des commandes** : Suivi des achats clients en temps réel.

### 🍳 Module "Zéro Déchet" (Recettes)
* Catalogue intégré de recettes anti-gaspillage.
* **IA / Suggestions** : Recommandation de recettes intelligentes basées sur les ingrédients des produits fraîchement achetés.

### ⚙️ Automatisations & Autres
* Géolocalisation des commerces partenaires.
* **Expiration automatique** des annonces une fois l'heure de retrait dépassée.
* Système de notifications pour les produits approchant de leur DLC.

---

## 🛡️ Démarche SecOps (Sécurité)

La sécurité a été au cœur du développement, en respectant les standards **OWASP Top 10** et **MITRE Top 25** :
1. **Analyse Statique (Code Review)** : Utilisation de **SonarQube** pour détecter les *Security Hotspots* et les vulnérabilités structurelles.
2. **Pentesting** : Audit dynamique avec **OWASP ZAP** (analyse des requêtes, formulaires et sessions).
3. **Secure Coding (Corrections appliquées)** :
   * Prévention des **Injections SQL** (utilisation systématique de requêtes préparées).
   * Protection **XSS** (validation et échappement des entrées côté serveur).
   * Protection des données sensibles et application du principe de moindre privilège.

---

## 📦 Installation & Déploiement

### 1. Cloner le projet
```bash
git clone <url-du-repo>
cd Eco_Stock
```

### 2. Base de données (PostgreSQL)
Lancer PostgreSQL et créer la base :
```bash
psql -U postgres
CREATE DATABASE ecostock;
\q
```
Importer le schéma de la base de données :
```bash
psql -U postgres -d ecostock -f ecostock_backend/Bd.sql
```

### 3. Configuration Backend
Installer les dépendances :
```bash
cd ecostock_backend
npm install
```
Créer un fichier `.env` à la racine de `ecostock_backend/` :
```env
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

### 4. Lancement de l'environnement

**Terminal 1 : Backend**
```bash
cd ecostock_backend
npm run dev # Lance le serveur avec auto-reload (nodemon)
```
*(💡 **Astuce** : Pour exposer le backend sur mobile, tu peux utiliser `ngrok http 3000` et mettre l'URL générée dans la configuration de l'API du frontend).*

**Terminal 2 : Frontend (Expo)**
```bash
cd Eco_Front
npm install
npx expo start --tunnel
```
*Scanne ensuite le QR code affiché avec l'application Expo Go sur ton téléphone.*

---

## 🔌 Référence de l'API (Endpoints Principaux)

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/auth/register` | `POST` | Création d'un nouveau compte (3 rôles) |
| `/api/auth/login` | `POST` | Authentification et génération du JWT |
| `/api/products` | `GET` | Récupération du catalogue produits |
| `/api/products/:id` | `GET` | Détails d'un produit spécifique |
| `/api/seller/products` | `POST` | Ajout d'un produit (Vendeur uniquement) |
| `/api/seller/my-products` | `GET` | Liste des produits d'un vendeur |
| `/api/cart` | `GET/POST/DELETE` | Gestion complète du panier utilisateur |
| `/api/orders` | `GET/POST` | Validation et historique des commandes |
| `/api/recipes` | `GET` | Catalogue des recettes anti-gaspi |
| `/api/recipes/suggestions` | `GET` | Recommandation selon les achats |

---

## 🛠 Commandes Utiles pour le Développement

**Base de données (psql) :**
```bash
\dt                                          # Voir toutes les tables
\d products                                  # Voir la structure de la table products
pg_dump -U postgres -d ecostock > backup.sql # Exporter la base
```

**Expo (Frontend) :**
```bash
npx expo start --clear                       # Lancer en vidant le cache (utile en cas de bug)
```
