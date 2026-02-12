const Redis = require('ioredis');

let redis = null;
let isConnected = false;

try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        console.log('[Redis] Arret des tentatives de reconnexion');
        return null; // Stop retrying
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redis.on('connect', () => {
    isConnected = true;
    console.log('[Redis] Connecte');
  });

  redis.on('error', (err) => {
    if (isConnected) {
      console.log('[Redis] Deconnecte - le cache est desactive');
    }
    isConnected = false;
  });

  redis.on('close', () => {
    isConnected = false;
  });

  // Tenter la connexion (non bloquant)
  redis.connect().catch(() => {
    console.log('[Redis] Non disponible - l\'app fonctionne sans cache');
  });
} catch (error) {
  console.log('[Redis] Non disponible - l\'app fonctionne sans cache');
}

module.exports = { redis, isConnected: () => isConnected };
