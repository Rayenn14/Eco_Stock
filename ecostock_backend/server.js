const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// MIDDLEWARE
// ========================================
app.use(cors());
app.use(express.json());

// Logging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// ========================================
// ROUTES
// ========================================
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Route d'accueil
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: '🚀 API EcoStock - Authentification',
    version: '1.0.0',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      verify: 'GET /api/auth/verify'
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

// ========================================
// ERREUR 404
// ========================================
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route introuvable' 
  });
});

// ========================================
// ERREURS GLOBALES
// ========================================
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err);
  res.status(500).json({ 
    success: false,
    message: 'Erreur serveur'
  });
});

// ========================================
// DÉMARRAGE
// ========================================
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║     🥬 ECOSTOCK API - AUTH ONLY       ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log('');
  console.log('📚 Endpoints:');
  console.log('   POST /api/auth/register   - Inscription');
  console.log('   POST /api/auth/login      - Connexion');
  console.log('   GET  /api/auth/verify     - Vérifier token');
  console.log('');
});
