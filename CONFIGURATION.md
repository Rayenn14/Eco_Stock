# Configuration de l'application Eco Stock

## Variables d'environnement (.env)

### Backend

Créer un fichier `.env` à la racine du dossier `ecostock_backend/` avec les variables suivantes:

```env
# Configuration de la base de données PostgreSQL
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecostock_db

# Configuration du serveur
PORT=3000
JWT_SECRET=votre_secret_jwt_tres_long_et_securise

# Configuration Cloudinary pour le stockage d'images
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
```

### Comment obtenir les identifiants Cloudinary

1. **Créer un compte Cloudinary**
   - Aller sur https://cloudinary.com/
   - Cliquer sur "Sign Up" (gratuit)
   - Créer un compte avec email

2. **Récupérer les identifiants**
   - Se connecter au Dashboard Cloudinary
   - Les informations se trouvent sur la page d'accueil:
     - `Cloud Name`: Nom de votre cloud
     - `API Key`: Clé API
     - `API Secret`: Secret API (cliquer sur l'œil pour le révéler)

3. **Copier dans le .env**
   ```env
   CLOUDINARY_CLOUD_NAME=dxxxxxxxx
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz12345
   ```

### Frontend

Créer un fichier `.env` à la racine du dossier `Eco_Front/` avec:

```env
# URL du backend (adapter selon votre configuration)
API_URL=http://192.168.137.1:3000/api
```

**Note**: Remplacer l'IP par:
- Votre IP locale si vous testez sur un appareil physique
- `localhost` ou `127.0.0.1` si vous testez sur émulateur
- L'IP de votre machine sur le réseau local

## Configuration de la base de données

1. **Installer PostgreSQL** (si pas déjà fait)
   - Télécharger depuis https://www.postgresql.org/download/
   - Installer avec pgAdmin

2. **Créer la base de données**
   ```bash
   psql -U postgres
   CREATE DATABASE ecostock_db;
   \q
   ```

3. **Importer le schéma**
   ```bash
   psql -U postgres -d ecostock_db -f ecostock_db.sql
   ```

4. **Supprimer les colonnes is_bio et is_local** (si migration nécessaire)
   ```bash
   psql -U postgres -d ecostock_db -f remove_is_bio_is_local.sql
   ```

## Installation et démarrage

### Backend
```bash
cd ecostock_backend
npm install
npm start
```

### Frontend
```bash
cd Eco_Front
npm install
npx expo start
```

## Fichiers à ne PAS commiter

Ajouter au `.gitignore`:
```
.env
.env.local
.env.development
.env.production
```

## Sécurité

⚠️ **IMPORTANT**:
- Ne JAMAIS commiter le fichier `.env`
- Ne JAMAIS partager vos clés Cloudinary
- Utiliser des valeurs différentes en production
- Générer un `JWT_SECRET` fort (au moins 32 caractères aléatoires)

## Support

Pour toute question sur la configuration, consulter:
- Documentation Cloudinary: https://cloudinary.com/documentation
- Documentation PostgreSQL: https://www.postgresql.org/docs/
