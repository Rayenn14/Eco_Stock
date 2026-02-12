const { redis, isConnected } = require('../config/redis');

/**
 * Recuperer une valeur du cache Redis
 * Retourne null si Redis est off ou cle inexistante
 */
async function getCache(key) {
  if (!isConnected()) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Stocker une valeur dans le cache Redis
 * @param {string} key - Cle du cache
 * @param {any} data - Donnees a stocker (sera JSON.stringify)
 * @param {number} ttl - Duree en secondes (defaut: 300 = 5 min)
 */
async function setCache(key, data, ttl = 300) {
  if (!isConnected()) return;
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } catch {
    // Silencieux - le cache est optionnel
  }
}

/**
 * Supprimer une ou plusieurs cles du cache
 * Supporte les patterns avec * (ex: "products:*")
 */
async function invalidateCache(pattern) {
  if (!isConnected()) return;
  try {
    if (pattern.includes('*')) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      await redis.del(pattern);
    }
  } catch {
    // Silencieux
  }
}

module.exports = { getCache, setCache, invalidateCache };
