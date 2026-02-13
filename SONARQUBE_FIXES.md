# Corrections SonarQube - EcoStock

## NIVEAU 1 : SECURITY (Blocker)

### 1.1 - Credentials hard-coded (S6437)
**Fichiers :** `ecostock_backend/__tests__/middleware/auth.test.js`, `ecostock_backend/__tests__/routes/auth.test.js`

**Avant :**
```js
process.env.JWT_SECRET = 'test-secret-key';
// ...
const tokenWithWrongSecret = jwt.sign(payload, 'wrong-secret');
```

**Apres :**
```js
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-ci';
// ...
const tokenWithWrongSecret = jwt.sign(payload, process.env.JWT_SECRET + '-invalid-suffix');
```

**Pourquoi :** SonarQube detecte les secrets ecrits en dur dans le code comme faille critique (meme dans les tests). Si quelqu'un lit le code source, il connait le secret utilise pour signer les JWT.

**Comment ca marche maintenant :**
- `process.env.JWT_SECRET || 'test-secret-key-for-ci'` : en local/CI, si la variable d'env existe deja (definie dans le `.env`), on l'utilise. Sinon, le fallback s'active uniquement pour les tests automatises.
- `process.env.JWT_SECRET + '-invalid-suffix'` : au lieu d'ecrire un faux secret en dur, on derive un secret invalide a partir du vrai. Le test verifie que le serveur rejette bien un token signe avec un autre secret.

---

## NIVEAU 2 : SECURITY HOTSPOT (High/Medium)

### 2.1 - Express version disclosure
**Fichier :** `ecostock_backend/server.js`

**Ajout :**
```js
app.disable('x-powered-by');
```

**Pourquoi :** Par defaut, chaque reponse HTTP de Express contient le header `X-Powered-By: Express`. Un attaquant qui voit ca sait qu'on utilise Express et peut chercher des failles connues specifiques a Express/Node.js. En le desactivant, on ne revele plus la techno utilisee. C'est une ligne, zero impact sur le fonctionnement.

### 2.2 - CORS trop permissif
**Fichier :** `ecostock_backend/server.js`

**Avant :**
```js
app.use(cors());  // Accepte TOUT le monde
```

**Apres :**
```js
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:19006'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);  // Mobile, curl
    if (allowedOrigins.includes(origin) || origin.endsWith('.ngrok-free.dev')) {
      return callback(null, true);
    }
    callback(new Error('Non autorise par CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

**Pourquoi :** `cors()` sans config envoie `Access-Control-Allow-Origin: *` dans chaque reponse. Ca veut dire que n'importe quel site web peut appeler notre API depuis le navigateur d'un utilisateur connecte (attaques CSRF/CORS).

**Comment ca marche maintenant :**

1. **`allowedOrigins`** : liste d'URLs autorisees a appeler l'API. Par defaut ce sont les URLs de dev (localhost). En prod on met les vraies URLs via le `.env`.

2. **`!origin`** : les requetes sans header `Origin` sont toujours autorisees. C'est le cas de :
   - L'app mobile React Native (pas un navigateur, donc pas d'origin)
   - Postman, curl, scripts serveur-a-serveur
   - Sans ca, l'app mobile ne pourrait plus appeler l'API

3. **`.ngrok-free.dev`** : autorise automatiquement tous les tunnels ngrok (utile pour tester l'app mobile sur le telephone en dev)

4. **`methods` / `allowedHeaders`** : restreint aux methodes HTTP et headers qu'on utilise reellement, au lieu de tout autoriser

5. **`credentials: true`** : permet l'envoi de cookies/tokens dans les requetes cross-origin

**Portabilite :** N'importe qui peut cloner le repo et lancer le serveur, ca marche directement avec les valeurs par defaut (localhost). En production, il suffit d'ajouter dans le `.env` :
```
ALLOWED_ORIGINS=https://mon-app.com,https://admin.mon-app.com
```

### 2.3 - Math.random() non cryptographique
**Fichier :** `Eco_Front/src/utils/ecoTips.ts`

**Avant :**
```ts
const randomIndex = Math.floor(Math.random() * ECO_TIPS.length);
```

**Apres :**
```ts
const array = new Uint32Array(1);
crypto.getRandomValues(array);
const randomIndex = array[0] % ECO_TIPS.length;
```

**Pourquoi :** `Math.random()` genere des nombres "pseudo-aleatoires" avec un algorithme previsible. Un attaquant peut deviner la sequence. `crypto.getRandomValues()` utilise le generateur cryptographique du systeme (CSPRNG), qui est imprevisible. Ici c'est juste pour afficher un conseil eco aleatoire (pas critique), mais SonarQube le flag quand meme car c'est une mauvaise pratique qui peut se propager dans du code plus sensible.

---

## NIVEAU 3 : RELIABILITY (104 corrections)

### 3.1 - parseFloat() -> Number.parseFloat() (79 occurrences)
**Fichiers modifies (13) :**
| Fichier | Corrections |
|---------|-------------|
| `ecostock_backend/routes/payment.js` | 10 |
| `ecostock_backend/routes/products.js` | 16 |
| `ecostock_backend/routes/seller.js` | 7 |
| `ecostock_backend/routes/reviews.js` | 2 |
| `ecostock_backend/routes/ingredients.js` | 2 |
| `Eco_Front/src/contexts/CartContext.tsx` | 1 |
| `Eco_Front/src/screens/AddProductScreen.tsx` | 8 |
| `Eco_Front/src/components/FilterModal.tsx` | 3 |
| `Eco_Front/src/screens/CartScreen.tsx` | 3 |
| `Eco_Front/src/components/ProductCard.tsx` | 4 |
| `Eco_Front/src/screens/HomeScreen.tsx` | 8 |
| `Eco_Front/src/screens/ProductDetailScreen.tsx` | 11 |
| `Eco_Front/src/screens/SellerProductsScreen.tsx` | 4 |

**Pourquoi :** `parseFloat()` et `parseInt()` existent en tant que fonctions globales depuis les debuts de JavaScript. Depuis ES2015, ces memes fonctions sont aussi disponibles en tant que methodes de `Number` : `Number.parseFloat()`, `Number.parseInt()`. Le comportement est strictement identique, mais la version `Number.*` est recommandee car :
- Elle est explicite : on voit que ca retourne un nombre
- Elle evite la pollution du scope global
- C'est le standard moderne que SonarQube et les linters attendent

Zero risque de casse : `Number.parseFloat('3.14')` retourne exactement la meme chose que `parseFloat('3.14')`.

### 3.2 - parseInt() -> Number.parseInt() (21 occurrences)
**Fichiers modifies (5) :**
| Fichier | Corrections |
|---------|-------------|
| `ecostock_backend/routes/products.js` | 6 |
| `ecostock_backend/routes/seller.js` | 6 |
| `ecostock_backend/routes/recipes.js` | 4 |
| `Eco_Front/src/screens/AddProductScreen.tsx` | 3 |
| `Eco_Front/src/screens/PaymentMethodsScreen.tsx` | 2 |

### 3.3 - isNaN() -> Number.isNaN() (4 occurrences)
**Fichiers modifies (2) :**
| Fichier | Corrections |
|---------|-------------|
| `Eco_Front/src/screens/AddProductScreen.tsx` | 3 |
| `ecostock_backend/__tests__/utils/logic.test.js` | 1 |

**Pourquoi :** `isNaN()` global a un comportement bizarre : il convertit d'abord l'argument en nombre, puis teste si c'est NaN. Du coup `isNaN("hello")` retourne `true` (car `Number("hello")` donne `NaN`), alors que `"hello"` n'est pas NaN, c'est une string.

`Number.isNaN()` est plus strict : il retourne `true` uniquement si la valeur est exactement `NaN`, sans conversion. C'est le comportement attendu et ca evite des bugs subtils.

---

## Resume

| Niveau | Type | Corrections | Fichiers |
|--------|------|-------------|----------|
| Blocker | Credentials hard-coded | 3 | 2 |
| High | X-Powered-By disclosure | 1 | 1 |
| Medium | CORS permissif | 1 | 1 |
| Medium | Math.random() faible | 1 | 1 |
| Low | parseFloat global | 79 | 13 |
| Low | parseInt global | 21 | 5 |
| Low | isNaN global | 4 | 2 |
| **Total** | | **110** | **21 fichiers** |

---

## COVERAGE : Pourquoi SonarQube affiche 0%

### Le probleme

SonarQube **ne lance pas les tests lui-meme**. Il analyse juste le code source. Pour afficher la couverture, il a besoin d'un **fichier de rapport** genere par Jest. Sans ce fichier, il affiche 0%.

### Comment ca marche

Le processus est en 2 etapes :

```
Jest lance les tests       -->  genere coverage/lcov.info
SonarQube lit lcov.info    -->  affiche le % de coverage
```

### Etape 1 : Generer le rapport de coverage

```bash
# Backend
cd ecostock_backend
npx jest --coverage

# Frontend
cd Eco_Front
npx jest --coverage
```

Ca cree un dossier `coverage/` dans chaque projet avec dedans :
- `lcov.info` : le fichier que SonarQube lit (format texte, liste chaque ligne couverte ou non)
- `coverage-report/index.html` : un rapport visuel qu'on peut ouvrir dans le navigateur

### Etape 2 : Configurer SonarQube pour lire le rapport

Dans le fichier `sonar-project.properties` a la racine du projet, ajouter :

```properties
sonar.javascript.lcov.reportPaths=ecostock_backend/coverage/lcov.info,Eco_Front/coverage/lcov.info
```

Ca dit a SonarQube : "le rapport de coverage est la, lis-le".

### Etape 3 : Relancer l'analyse SonarQube

```bash
# Generer la coverage d'abord
cd ecostock_backend && npx jest --coverage && cd ..

# Puis lancer SonarQube
sonar-scanner
```

### Ce que Jest mesure

Quand on lance `npx jest --coverage`, Jest execute chaque test et note quelles lignes du code source ont ete executees :

- **Statements** : % d'instructions executees
- **Branches** : % de conditions if/else testees (les deux cas)
- **Functions** : % de fonctions appelees au moins une fois
- **Lines** : % de lignes executees

Exemple de sortie :
```
--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
routes/auth.js      |   85.71 |    78.57 |   100   |   85.71 |
routes/products.js  |   42.31 |    25.00 |   50.00 |   42.31 |
middleware/auth.js  |   95.00 |    90.00 |   100   |   95.00 |
--------------------|---------|----------|---------|---------|
```

### Config Jest existante

Le backend est deja configure pour la coverage dans `jest.config.js` :
```js
collectCoverageFrom: [
  'routes/**/*.js',      // Mesure la couverture de toutes les routes
  'middleware/**/*.js',   // Et du middleware
  '!**/node_modules/**',
],
```

Donc `npx jest --coverage` dans `ecostock_backend/` va directement fonctionner et generer le rapport.

### Resume

| Etape | Commande | Resultat |
|-------|----------|----------|
| 1. Lancer les tests avec coverage | `npx jest --coverage` | Genere `coverage/lcov.info` |
| 2. Configurer SonarQube | `sonar.javascript.lcov.reportPaths=...` dans `sonar-project.properties` | SonarQube sait ou lire |
| 3. Relancer l'analyse | `sonar-scanner` | Coverage affichee dans SonarQube |
