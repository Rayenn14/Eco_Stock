const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticateToken } = require('../middleware/auth');
const checkExpiredProducts = require('../middleware/checkExpiredProducts');

// Vérifier les produits expirés avant chaque requête
router.use(checkExpiredProducts);

// GET /ingredients/products/:ingredientName - Trouver les produits contenant un ingrédient
router.get('/products/:ingredientName', authenticateToken, async (req, res) => {
  try {
    const { ingredientName } = req.params;
    const { latitude, longitude } = req.query;

    console.log(`[Ingredients] Recherche produits pour ingrédient: ${ingredientName}`);

    // Requete complexe avec Haversine -> $queryRaw
    const products = await prisma.$queryRawUnsafe(
      `SELECT
        p.id,
        p.nom,
        p.description,
        p.prix,
        p.prix_original,
        p.image_url,
        p.dlc,
        p.stock,
        p.is_disponible,
        c.nom_commerce,
        c.adresse,
        c.latitude,
        c.longitude,
        cat.nom as category_name,
        CASE
          WHEN $2::float IS NOT NULL AND $3::float IS NOT NULL AND c.latitude IS NOT NULL AND c.longitude IS NOT NULL THEN
            (6371 * acos(cos(radians($2)) * cos(radians(c.latitude)) * cos(radians(c.longitude) - radians($3)) + sin(radians($2)) * sin(radians(c.latitude))))
          ELSE NULL
        END as distance
      FROM products p
      INNER JOIN users u ON p.vendeur_id = u.id
      LEFT JOIN commerces c ON u.id = c.vendeur_id
      LEFT JOIN categories cat ON p.category_id = cat.id
      INNER JOIN product_items pi ON p.id = pi.product_id
      INNER JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE p.is_disponible = true
        AND p.stock > 0
        AND p.dlc >= CURRENT_DATE
        AND (p.pickup_end_time IS NULL OR (p.created_at::date + p.pickup_end_time) > NOW())
        AND LOWER(i.name) = LOWER($1)
      ORDER BY
        CASE
          WHEN $2::float IS NOT NULL AND $3::float IS NOT NULL THEN
            (6371 * acos(cos(radians($2)) * cos(radians(c.latitude)) * cos(radians(c.longitude) - radians($3)) + sin(radians($2)) * sin(radians(c.latitude))))
          ELSE p.prix::float
        END ASC
      LIMIT 20`,
      ingredientName, latitude ? parseFloat(latitude) : null, longitude ? parseFloat(longitude) : null
    );

    console.log(`[Ingredients] Trouvé ${products.length} produits pour ${ingredientName}`);

    res.json({
      success: true,
      products,
      count: products.length
    });
  } catch (error) {
    console.error('[Ingredients] Erreur recherche produits:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche de produits'
    });
  }
});

module.exports = router;
