const { markExpiredByPickupTime } = require('../utils/cleanupExpiredProducts');

/**
 * Middleware qui vérifie et met à jour les produits expirés avant chaque requête
 * Utilise un cache pour éviter de vérifier trop souvent (1 fois par minute max)
 */
let lastCheck = 0;
const CHECK_INTERVAL = 60000; // 1 minute en ms

const checkExpiredProducts = async (req, res, next) => {
  const now = Date.now();

  // Vérifier seulement si l'intervalle est passé
  if (now - lastCheck > CHECK_INTERVAL) {
    lastCheck = now;
    try {
      await markExpiredByPickupTime();
    } catch (error) {
      console.error('[MIDDLEWARE] Erreur vérification expiration:', error);
    }
  }

  next();
};

module.exports = checkExpiredProducts;
