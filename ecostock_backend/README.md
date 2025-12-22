# EcoStock Backend

API backend pour l'application EcoStock.

## Installation

1. Cloner le projet
2. Installer les dépendances :
```bash
npm install
```

## Configuration de l'environnement

### Créer le fichier `.env`

Le projet nécessite un fichier `.env` à la racine du dossier backend. Ce fichier contient les variables d'environnement sensibles et **ne doit jamais être commité dans Git**.

1. Copier le fichier `.env.example` en `.env` :
```bash
cp .env.example .env
```

2. Modifier le fichier `.env` avec vos propres valeurs :

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecostock_db
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe

# JWT Configuration
JWT_SECRET=votre_clé_secrète_jwt
JWT_EXPIRE=90d

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:8081
```

### Variables d'environnement expliquées

- **DB_HOST** : Adresse du serveur PostgreSQL (généralement `localhost`)
- **DB_PORT** : Port PostgreSQL (par défaut `5432`)
- **DB_NAME** : Nom de votre base de données
- **DB_USER** : Nom d'utilisateur PostgreSQL
- **DB_PASSWORD** : Mot de passe PostgreSQL
- **JWT_SECRET** : Clé secrète pour signer les tokens JWT (utilisez une chaîne aléatoire longue)
- **JWT_EXPIRE** : Durée de validité des tokens (ex: `90d` pour 90 jours)
- **PORT** : Port sur lequel le serveur écoute (par défaut `3000`)
- **NODE_ENV** : Environnement d'exécution (`development` ou `production`)
- **FRONTEND_URL** : URL du frontend pour la configuration CORS

### Générer un JWT_SECRET sécurisé

Pour générer une clé JWT sécurisée, vous pouvez utiliser :

```bash
# Avec Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Lancement du projet

### Mode développement (avec redémarrage automatique)
```bash
npm run dev
```

### Mode production
```bash
npm start
```

## Structure du projet

```
ecostock_backend/
├── src/               # Code source
├── .env              # Variables d'environnement (NON COMMITÉ)
├── .env.example      # Template des variables d'environnement
└── package.json      # Dépendances et scripts
```

## Sécurité

Le fichier `.env` ne doit jamais être commité dans Git car il contient des informations sensibles (mots de passe, clés secrètes). Le fichier `.gitignore` est configuré pour l'ignorer automatiquement.
