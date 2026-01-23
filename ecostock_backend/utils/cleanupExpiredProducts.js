const db = require('../config/database');

/**
 * Supprime les produits dont la DLC est dépassée
 * Cette fonction devrait être appelée régulièrement (par exemple, une fois par jour via un cron job)
 */
async function cleanupExpiredProducts() {
  try {
    console.log('[CLEANUP] Démarrage du nettoyage des produits expirés...');

    const result = await db.query(
      `DELETE FROM products
       WHERE dlc < CURRENT_DATE
       RETURNING id, nom, dlc, vendeur_id`
    );

    if (result.rows.length > 0) {
      console.log(`[CLEANUP] ${result.rows.length} produit(s) expiré(s) supprimé(s):`);
      result.rows.forEach(product => {
        console.log(`  - ${product.nom} (DLC: ${product.dlc})`);
      });
    } else {
      console.log('[CLEANUP] Aucun produit expiré à supprimer');
    }

    return {
      success: true,
      deletedCount: result.rows.length,
      deletedProducts: result.rows
    };
  } catch (error) {
    console.error('[CLEANUP] Erreur lors du nettoyage des produits expirés:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Marque comme indisponibles les produits dont le pickup_end_time est dépassé
 * Vérifie si (created_at::date + pickup_end_time) < NOW()
 */
async function markExpiredByPickupTime() {
  try {
    const result = await db.query(
      `UPDATE products
       SET is_disponible = false, updated_at = NOW()
       WHERE is_disponible = true
         AND pickup_end_time IS NOT NULL
         AND (created_at::date + pickup_end_time) < NOW()
       RETURNING id, nom, pickup_end_time, created_at`
    );

    if (result.rows.length > 0) {
      console.log(`[CLEANUP] ${result.rows.length} produit(s) expiré(s) par pickup_end_time`);
    }

    return {
      success: true,
      updatedCount: result.rows.length,
      updatedProducts: result.rows
    };
  } catch (error) {
    console.error('[CLEANUP] Erreur markExpiredByPickupTime:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Marque comme indisponibles les produits dont le stock est à 0
 */
async function markOutOfStockProducts() {
  try {
    console.log('[CLEANUP] Marquage des produits en rupture de stock...');

    const result = await db.query(
      `UPDATE products
       SET is_disponible = false
       WHERE stock <= 0 AND is_disponible = true
       RETURNING id, nom, stock`
    );

    if (result.rows.length > 0) {
      console.log(`[CLEANUP] ${result.rows.length} produit(s) marqué(s) comme indisponible(s):`);
      result.rows.forEach(product => {
        console.log(`  - ${product.nom} (Stock: ${product.stock})`);
      });
    } else {
      console.log('[CLEANUP] Aucun produit en rupture de stock');
    }

    return {
      success: true,
      updatedCount: result.rows.length,
      updatedProducts: result.rows
    };
  } catch (error) {
    console.error('[CLEANUP] Erreur lors du marquage des produits en rupture:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Exécute toutes les tâches de nettoyage
 */
async function runCleanup() {
  console.log('\n========================================');
  console.log('NETTOYAGE AUTOMATIQUE DES PRODUITS');
  console.log(`Date: ${new Date().toLocaleString('fr-FR')}`);
  console.log('========================================\n');

  const expiredResult = await cleanupExpiredProducts();
  const pickupResult = await markExpiredByPickupTime();
  const stockResult = await markOutOfStockProducts();

  console.log('\n========================================');
  console.log('RÉSUMÉ DU NETTOYAGE');
  console.log(`Produits expirés (DLC) supprimés: ${expiredResult.deletedCount || 0}`);
  console.log(`Produits expirés (pickup_end_time): ${pickupResult.updatedCount || 0}`);
  console.log(`Produits marqués indisponibles (stock): ${stockResult.updatedCount || 0}`);
  console.log('========================================\n');

  return {
    expired: expiredResult,
    pickup: pickupResult,
    stock: stockResult
  };
}

// Si ce script est exécuté directement (node utils/cleanupExpiredProducts.js)
if (require.main === module) {
  runCleanup()
    .then(() => {
      console.log('Nettoyage terminé avec succès');
      process.exit(0);
    })
    .catch(error => {
      console.error('Erreur lors du nettoyage:', error);
      process.exit(1);
    });
}

module.exports = {
  cleanupExpiredProducts,
  markExpiredByPickupTime,
  markOutOfStockProducts,
  runCleanup
};
