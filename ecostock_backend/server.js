const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});


// ROUTES
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const productsRoutes = require('./routes/products');
const sellerRoutes = require('./routes/seller');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/seller', sellerRoutes);

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
