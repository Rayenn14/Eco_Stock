const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Securite: masquer la version Express
app.disable('x-powered-by');

// CORS configure avec origines autorisees
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:19006'];

app.use(cors({
  origin: function (origin, callback) {
    // Autoriser les requetes sans origin (mobile, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.ngrok-free.dev')) {
      return callback(null, true);
    }
    callback(new Error('Non autorise par CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});


// ROUTES
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const productsRoutes = require('./routes/products');
const sellerRoutes = require('./routes/seller');
const recipesRoutes = require('./routes/recipes');
const ingredientsRoutes = require('./routes/ingredients');
const paymentRoutes = require('./routes/payment');
const reviewsRoutes = require('./routes/reviews');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/recipes', recipesRoutes);
app.use('/api/ingredients', ingredientsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reviews', reviewsRoutes);

// PROXY AI - Relaye vers le serveur Python (port 5001)
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
    console.error('Erreur proxy AI:', error.message);
    res.status(503).json({
      success: false,
      error: 'Serveur IA non disponible. Lancez: python ai_server.py'
    });
  }
});

app.get('/api/ai/health', async (req, res) => {
  try {
    const response = await fetch('http://localhost:5001/api/ai/health');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.json({ success: false, status: 'offline' });
  }
});

// Route d'accueil
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'API EcoStock - Authentification',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        verify: 'GET /api/auth/verify'
      },
      profile: {
        get: 'GET /api/profile',
        update: 'PUT /api/profile',
        uploadImage: 'POST /api/profile/upload-image'
      },
      products: {
        getAll: 'GET /api/products',
        getById: 'GET /api/products/:id'
      },
      seller: {
        myProducts: 'GET /api/seller/my-products',
        addProduct: 'POST /api/seller/products',
        updateProduct: 'PUT /api/seller/products/:id',
        deleteProduct: 'DELETE /api/seller/products/:id',
        categories: 'GET /api/seller/categories',
        orders: 'GET /api/seller/orders',
        updateOrderStatus: 'PUT /api/seller/orders/:id/status'
      }
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'OK'
  });
});

// ERREUR 404
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route introuvable' 
  });
});

// ERREURS GLOBALES
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(500).json({ 
    success: false,
    message: 'Erreur serveur'
  });
});

// DÉMARRAGE
app.listen(PORT, () => {
  console.log('');
  console.log('');
  console.log(` Serveur démarré sur le port ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`)
});
