const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /ingredients/products/:ingredientName - Trouver les produits contenant un ingrédient
router.get('/products/:ingredientName', authenticateToken, async (req, res) => {
  try {
    const { ingredientName } = req.params;
    const { latitude, longitude } = req.query;

    console.log(`[Ingredients] Recherche produits pour ingrédient: ${ingredientName}`);

    // Rechercher les produits contenant cet ingrédient
    const result = await db.query(
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
        AND LOWER(i.name) = LOWER($1)
      ORDER BY
        CASE
          WHEN $2::float IS NOT NULL AND $3::float IS NOT NULL THEN
            (6371 * acos(cos(radians($2)) * cos(radians(c.latitude)) * cos(radians(c.longitude) - radians($3)) + sin(radians($2)) * sin(radians(c.latitude))))
          ELSE p.prix::float
        END ASC
      LIMIT 20`,
      [ingredientName, latitude || null, longitude || null]
    );

    console.log(`[Ingredients] Trouvé ${result.rows.length} produits pour ${ingredientName}`);

    res.json({
      success: true,
      products: result.rows,
      count: result.rows.length
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
