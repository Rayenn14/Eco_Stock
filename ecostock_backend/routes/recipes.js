const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /recipes - Récupérer des recettes aléatoires avec pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 6, offset = 0 } = req.query;

    const result = await db.query(
      `SELECT
        r.id,
        r.title,
        r.instructions,
        r.image_name,
        rc.nom as category,
        r.created_at,
        ARRAY_AGG(DISTINCT i.name ORDER BY i.name) FILTER (WHERE i.id IS NOT NULL) as ingredients
      FROM recipes r
      LEFT JOIN recipe_categories rc ON r.recipe_category_id = rc.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN ingredients i ON ri.ingredient_id = i.id
      GROUP BY r.id, rc.id, rc.nom
      ORDER BY RANDOM()
      LIMIT $1 OFFSET $2`,
      [parseInt(limit), parseInt(offset)]
    );

    const countResult = await db.query('SELECT COUNT(*) as total FROM recipes');

    res.json({
      success: true,
      recipes: result.rows,
      total: parseInt(countResult.rows[0].total),
      hasMore: parseInt(offset) + result.rows.length < parseInt(countResult.rows[0].total)
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recettes'
    });
  }
});

// GET /recipes/search - Rechercher des recettes
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query, category } = req.query;

    // Si pas de query et pas de category, retourner vide
    if ((!query || query.trim().length < 2) && !category) {
      return res.json({
        success: true,
        recipes: []
      });
    }

    const searchQuery = query ? query.trim().toLowerCase() : '';
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    // Si on a une recherche textuelle
    const hasTextSearch = searchQuery.length >= 2;

    if (hasTextSearch) {
      params.push(searchQuery);
      conditions.push(`(
        LOWER(r.title) LIKE '%' || LOWER($${paramIndex}) || '%'
        OR LOWER(i.name) LIKE '%' || LOWER($${paramIndex}) || '%'
      )`);
      paramIndex++;
    }

    if (category) {
      params.push(category);
      conditions.push(`rc.nom = $${paramIndex++}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Construction du score
    let scoreCalc = '50'; // Score par défaut
    if (hasTextSearch) {
      scoreCalc = `CASE
        WHEN LOWER(r.title) = LOWER($1) THEN 100
        WHEN LOWER(r.title) LIKE LOWER($1) || '%' THEN 90
        WHEN LOWER(r.title) LIKE '%' || LOWER($1) || '%' THEN 70
        WHEN MAX(CASE WHEN LOWER(i.name) = LOWER($1) THEN 1 ELSE 0 END) = 1 THEN 85
        WHEN MAX(CASE WHEN LOWER(i.name) LIKE LOWER($1) || '%' THEN 1 ELSE 0 END) = 1 THEN 75
        WHEN MAX(CASE WHEN LOWER(i.name) LIKE '%' || LOWER($1) || '%' THEN 1 ELSE 0 END) = 1 THEN 60
        ELSE 50
      END`;
    }

    const result = await db.query(
      `SELECT
        r.id,
        r.title,
        r.instructions,
        r.image_name,
        rc.nom as category,
        r.created_at,
        ARRAY_AGG(DISTINCT i.name ORDER BY i.name) FILTER (WHERE i.id IS NOT NULL) as ingredients,
        ${scoreCalc} as score
      FROM recipes r
      LEFT JOIN recipe_categories rc ON r.recipe_category_id = rc.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN ingredients i ON ri.ingredient_id = i.id
      ${whereClause}
      GROUP BY r.id, rc.id, rc.nom
      ORDER BY score DESC, r.created_at DESC
      LIMIT 50`,
      params
    );

    res.json({
      success: true,
      recipes: result.rows
    });
  } catch (error) {
    console.error('Error searching recipes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche de recettes'
    });
  }
});

// GET /recipes/by-ingredients - Trouver des recettes selon les ingrédients
router.get('/by-ingredients', authenticateToken, async (req, res) => {
  try {
    const { ingredients } = req.query;

    if (!ingredients || ingredients.trim().length === 0) {
      return res.json({
        success: true,
        recipes: []
      });
    }

    // Convertir la liste d'ingrédients en tableau
    const ingredientList = ingredients.split(',').map(i => i.trim().toLowerCase());

    const result = await db.query(
      `SELECT
        r.id,
        r.title,
        r.instructions,
        r.image_name,
        rc.nom as category,
        r.created_at,
        ARRAY_AGG(DISTINCT i.name ORDER BY i.name) FILTER (WHERE i.id IS NOT NULL) as ingredients,
        COUNT(DISTINCT CASE
          WHEN LOWER(i.name) = ANY($1::text[]) THEN i.id
        END) as matching_ingredients,
        COUNT(DISTINCT ri.ingredient_id) as total_ingredients
      FROM recipes r
      LEFT JOIN recipe_categories rc ON r.recipe_category_id = rc.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN ingredients i ON ri.ingredient_id = i.id
      GROUP BY r.id, rc.id, rc.nom
      HAVING COUNT(DISTINCT CASE
        WHEN LOWER(i.name) = ANY($1::text[]) THEN i.id
      END) > 0
      ORDER BY
        matching_ingredients DESC,
        total_ingredients ASC,
        r.created_at DESC
      LIMIT 50`,
      [ingredientList]
    );

    res.json({
      success: true,
      recipes: result.rows
    });
  } catch (error) {
    console.error('Error finding recipes by ingredients:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche de recettes par ingrédients'
    });
  }
});

// GET /recipes/:id - Récupérer une recette par ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT
        r.id,
        r.title,
        r.instructions,
        r.image_name,
        rc.nom as category,
        r.created_at,
        ARRAY_AGG(DISTINCT i.name ORDER BY i.name) FILTER (WHERE i.id IS NOT NULL) as ingredients
      FROM recipes r
      LEFT JOIN recipe_categories rc ON r.recipe_category_id = rc.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE r.id = $1
      GROUP BY r.id, rc.id, rc.nom`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recette non trouvée'
      });
    }

    res.json({
      success: true,
      recipe: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la recette'
    });
  }
});

module.exports = router;
