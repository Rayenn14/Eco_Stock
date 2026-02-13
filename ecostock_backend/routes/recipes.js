const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticateToken } = require('../middleware/auth');
const { getCache, setCache } = require('../utils/cache');

// GET /recipes - Récupérer des recettes aléatoires avec pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 6, offset = 0 } = req.query;

    // Cache les recettes (TTL: 10 min)
    const cacheKey = `recipes:page:${limit}:${offset}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Requete complexe avec ARRAY_AGG -> $queryRaw
    const recipes = await prisma.$queryRaw`
      SELECT
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
      LIMIT ${Number.parseInt(limit)} OFFSET ${Number.parseInt(offset)}`;

    const countResult = await prisma.recipes.count();

    const response = {
      success: true,
      recipes,
      total: countResult,
      hasMore: Number.parseInt(offset) + recipes.length < countResult
    };

    await setCache(cacheKey, response, 600);

    res.json(response);
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

    let scoreCalc = '50';
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

    // Requete complexe avec scoring -> $queryRawUnsafe
    const recipes = await prisma.$queryRawUnsafe(
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
      ...params
    );

    res.json({
      success: true,
      recipes
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

    const ingredientList = ingredients.split(',').map(i => i.trim().toLowerCase());

    const recipes = await prisma.$queryRaw`
      SELECT
        r.id,
        r.title,
        r.instructions,
        r.image_name,
        rc.nom as category,
        r.created_at,
        ARRAY_AGG(DISTINCT i.name ORDER BY i.name) FILTER (WHERE i.id IS NOT NULL) as ingredients,
        COUNT(DISTINCT CASE
          WHEN LOWER(i.name) = ANY(${ingredientList}::text[]) THEN i.id
        END) as matching_ingredients,
        COUNT(DISTINCT ri.ingredient_id) as total_ingredients
      FROM recipes r
      LEFT JOIN recipe_categories rc ON r.recipe_category_id = rc.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN ingredients i ON ri.ingredient_id = i.id
      GROUP BY r.id, rc.id, rc.nom
      HAVING COUNT(DISTINCT CASE
        WHEN LOWER(i.name) = ANY(${ingredientList}::text[]) THEN i.id
      END) > 0
      ORDER BY
        matching_ingredients DESC,
        total_ingredients ASC,
        r.created_at DESC
      LIMIT 50`;

    res.json({
      success: true,
      recipes
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

    // Cache recette par ID (TTL: 30 min)
    const cacheKey = `recipe:${id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const recipes = await prisma.$queryRaw`
      SELECT
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
      WHERE r.id = ${Number.parseInt(id)}
      GROUP BY r.id, rc.id, rc.nom`;

    if (recipes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recette non trouvée'
      });
    }

    const response = {
      success: true,
      recipe: recipes[0]
    };

    await setCache(cacheKey, response, 1800);

    res.json(response);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la recette'
    });
  }
});

// GET /recipes/ingredients/search - Rechercher des ingrédients pour auto-complétion
router.get('/ingredients/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        ingredients: []
      });
    }

    const searchQuery = query.trim().toLowerCase();

    // Cache les recherches d'ingrédients (TTL: 15 min)
    const cacheKey = `ingredients:search:${searchQuery}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, ingredients: cached });
    }

    const ingredients = await prisma.$queryRaw`
      SELECT
        DISTINCT i.id,
        i.name,
        CASE
          WHEN LOWER(i.name) = ${searchQuery} THEN 100
          WHEN LOWER(i.name) LIKE ${searchQuery + '%'} THEN 90
          WHEN LOWER(i.name) LIKE ${'%' + searchQuery + '%'} THEN 70
          ELSE 50
        END as score
      FROM ingredients i
      WHERE LOWER(i.name) LIKE ${'%' + searchQuery + '%'}
      ORDER BY score DESC, i.name ASC
      LIMIT 20`;

    await setCache(cacheKey, ingredients, 900);

    res.json({
      success: true,
      ingredients
    });
  } catch (error) {
    console.error('Error searching ingredients:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche d\'ingrédients'
    });
  }
});

module.exports = router;
