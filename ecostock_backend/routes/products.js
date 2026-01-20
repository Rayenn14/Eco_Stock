const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Route de recherche de produits
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query, latitude, longitude, page, limit } = req.query;
    const userType = req.user.user_type;

    // Pagination parameters
    const currentPage = parseInt(page) || 1;
    const pageLimit = parseInt(limit) || 50; // Plus élevé pour la recherche
    const offset = (currentPage - 1) * pageLimit;

    console.log('[Products] GET /search - user_type:', userType, 'query:', query, 'page:', currentPage);

    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        products: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalProducts: 0,
          limit: pageLimit,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      });
    }

    const searchQuery = query.trim();

    // Construire le filtre pour reserved_for_associations
    const reservedFilter = userType === 'association'
      ? '' // Les associations voient tout
      : 'AND (p.reserved_for_associations = false OR p.reserved_for_associations IS NULL)';

    console.log('[Products] Reserved filter:', reservedFilter || 'none (association)');

    // Recherche par nom de produit OU ingrédients avec scoring basé sur la position
    const result = await db.query(
      `SELECT
        p.id,
        p.nom,
        p.description,
        p.prix,
        p.prix_original,
        p.stock,
        p.image_url,
        p.dlc,
        p.is_disponible,
        p.is_lot,
        p.created_at,
        c.nom_commerce,
        c.adresse,
        c.latitude,
        c.longitude,
        cat.nom as category_name,
        u.prenom as vendeur_prenom,
        u.nom as vendeur_nom,
        STRING_AGG(DISTINCT i.name, ', ') as ingredient_nom,
        ARRAY_AGG(DISTINCT i.id) FILTER (WHERE i.id IS NOT NULL) as ingredient_ids,
        CASE
          WHEN LOWER(p.nom) = LOWER($1) THEN 100
          WHEN LOWER(p.nom) LIKE LOWER($1) || '%' THEN 90
          WHEN LOWER(p.nom) LIKE '%' || LOWER($1) || '%' THEN 70
          WHEN MAX(CASE WHEN LOWER(i.name) = LOWER($1) THEN 1 ELSE 0 END) = 1 THEN 85
          WHEN MAX(CASE WHEN LOWER(i.name) LIKE LOWER($1) || '%' THEN 1 ELSE 0 END) = 1 THEN 75
          WHEN MAX(CASE WHEN LOWER(i.name) LIKE '%' || LOWER($1) || '%' THEN 1 ELSE 0 END) = 1 THEN 60
          ELSE 50
        END as score
      FROM products p
      INNER JOIN users u ON p.vendeur_id = u.id
      LEFT JOIN commerces c ON u.id = c.vendeur_id
      LEFT JOIN categories cat ON p.category_id = cat.id
      LEFT JOIN product_items pi ON p.id = pi.product_id
      LEFT JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE p.is_disponible = true
        AND p.stock > 0
        AND p.dlc >= CURRENT_DATE
        AND (p.pickup_end_time IS NULL OR (p.created_at::date + p.pickup_end_time) > NOW())
        ${reservedFilter}
        AND (
          LOWER(p.nom) LIKE '%' || LOWER($1) || '%'
          OR LOWER(i.name) LIKE '%' || LOWER($1) || '%'
          OR LOWER(p.description) LIKE '%' || LOWER($1) || '%'
          OR LOWER(cat.nom) LIKE '%' || LOWER($1) || '%'
        )
      GROUP BY p.id, c.nom_commerce, c.adresse, c.latitude, c.longitude, cat.nom, u.prenom, u.nom
      ORDER BY score DESC, p.created_at DESC
      LIMIT $2 OFFSET $3`,
      [searchQuery, pageLimit, offset]
    );

    // Count total (pour pagination)
    const countResult = await db.query(
      `SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      INNER JOIN users u ON p.vendeur_id = u.id
      LEFT JOIN commerces c ON u.id = c.vendeur_id
      LEFT JOIN categories cat ON p.category_id = cat.id
      LEFT JOIN product_items pi ON p.id = pi.product_id
      LEFT JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE p.is_disponible = true
        AND p.stock > 0
        AND p.dlc >= CURRENT_DATE
        AND (p.pickup_end_time IS NULL OR (p.created_at::date + p.pickup_end_time) > NOW())
        ${reservedFilter}
        AND (
          LOWER(p.nom) LIKE '%' || LOWER($1) || '%'
          OR LOWER(i.name) LIKE '%' || LOWER($1) || '%'
          OR LOWER(p.description) LIKE '%' || LOWER($1) || '%'
          OR LOWER(cat.nom) LIKE '%' || LOWER($1) || '%'
        )`,
      [searchQuery]
    );

    const totalProducts = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalProducts / pageLimit);

    let userLat = latitude ? parseFloat(latitude) : null;
    let userLon = longitude ? parseFloat(longitude) : null;

    const products = result.rows.map(product => {
      let distance = null;
      let walkingTime = null;
      let transitTime = null;
      let cyclingTime = null;

      if (userLat && userLon && product.latitude && product.longitude) {
        const prodLat = parseFloat(product.latitude);
        const prodLon = parseFloat(product.longitude);

        const R = 6371;
        const dLat = (prodLat - userLat) * Math.PI / 180;
        const dLon = (prodLon - userLon) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(userLat * Math.PI / 180) * Math.cos(prodLat * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = R * c;

        walkingTime = Math.round((distance / 5) * 60);
        cyclingTime = Math.round((distance / 15) * 60);

        if (distance < 2) {
          transitTime = walkingTime;
        } else {
          transitTime = Math.round((distance / 20) * 60);
        }
      }

      return {
        ...product,
        distance: distance ? distance.toFixed(2) : null,
        walking_time: walkingTime,
        cycling_time: cyclingTime,
        transit_time: transitTime
      };
    });

    res.json({
      success: true,
      products,
      pagination: {
        currentPage: currentPage,
        totalPages: totalPages,
        totalProducts: totalProducts,
        limit: pageLimit,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      }
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche de produits'
    });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, category, minPrice, maxPrice, maxDlcDate, maxDistance, page, limit } = req.query;
    const userType = req.user.user_type; // 'client', 'vendeur', ou 'association'

    // Pagination parameters
    const currentPage = parseInt(page) || 1;
    const pageLimit = parseInt(limit) || 20;
    const offset = (currentPage - 1) * pageLimit;

    console.log('[Products] GET / - user_type:', userType, 'page:', currentPage, 'limit:', pageLimit);

    // Build WHERE conditions
    const conditions = [
      'p.is_disponible = true',
      'p.stock > 0',
      'p.dlc >= CURRENT_DATE',
      '(p.pickup_end_time IS NULL OR (p.created_at::date + p.pickup_end_time) > NOW())'
    ];

    // Filtrer les produits réservés aux associations
    if (userType === 'association') {
      // Les associations voient tous les produits (réservés ou non)
      console.log('[Products] User is association - showing all products');
    } else {
      // Les clients ne voient que les produits NON réservés aux associations
      conditions.push('(p.reserved_for_associations = false OR p.reserved_for_associations IS NULL)');
      console.log('[Products] User is client/vendeur - hiding reserved products');
    }

    const params = [];
    let paramIndex = 1;

    if (category) {
      params.push(category);
      conditions.push(`p.category_id = $${paramIndex++}`);
    }

    if (minPrice) {
      params.push(parseFloat(minPrice));
      conditions.push(`p.prix >= $${paramIndex++}`);
    }

    if (maxPrice) {
      params.push(parseFloat(maxPrice));
      conditions.push(`p.prix <= $${paramIndex++}`);
    }

    if (maxDlcDate) {
      params.push(maxDlcDate);
      conditions.push(`p.dlc <= $${paramIndex++}`);
    }

    const whereClause = conditions.join(' AND ');

    // Count total products (for pagination metadata)
    const countResult = await db.query(
      `SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      INNER JOIN users u ON p.vendeur_id = u.id
      LEFT JOIN commerces c ON u.id = c.vendeur_id
      WHERE ${whereClause}`,
      params
    );

    const totalProducts = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalProducts / pageLimit);

    // Add LIMIT and OFFSET to params
    params.push(pageLimit);
    const limitParam = paramIndex++;
    params.push(offset);
    const offsetParam = paramIndex++;

    const result = await db.query(
      `SELECT
        p.id,
        p.nom,
        p.description,
        p.prix,
        p.prix_original,
        p.stock,
        p.image_url,
        p.dlc,
        p.is_disponible,
        p.is_lot,
        p.created_at,
        c.nom_commerce,
        c.adresse,
        c.latitude,
        c.longitude,
        cat.nom as category_name,
        u.prenom as vendeur_prenom,
        u.nom as vendeur_nom,
        STRING_AGG(DISTINCT i.name, ', ') as ingredient_nom,
        ARRAY_AGG(DISTINCT i.id) FILTER (WHERE i.id IS NOT NULL) as ingredient_ids
      FROM products p
      INNER JOIN users u ON p.vendeur_id = u.id
      LEFT JOIN commerces c ON u.id = c.vendeur_id
      LEFT JOIN categories cat ON p.category_id = cat.id
      LEFT JOIN product_items pi ON p.id = pi.product_id
      LEFT JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE ${whereClause}
      GROUP BY p.id, c.nom_commerce, c.adresse, c.latitude, c.longitude, cat.nom, u.prenom, u.nom
      ORDER BY p.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}`,
      params
    );

    let userLat = latitude ? parseFloat(latitude) : null;
    let userLon = longitude ? parseFloat(longitude) : null;

    let products = result.rows.map(product => {
      let distance = null;
      let walkingTime = null;
      let transitTime = null;
      let cyclingTime = null;

      if (userLat && userLon && product.latitude && product.longitude) {
        const prodLat = parseFloat(product.latitude);
        const prodLon = parseFloat(product.longitude);

        const R = 6371;
        const dLat = (prodLat - userLat) * Math.PI / 180;
        const dLon = (prodLon - userLon) * Math.PI / 180;
        const a =
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(userLat * Math.PI / 180) * Math.cos(prodLat * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = R * c;

        // Temps à pied : 5 km/h en vitesse moyenne
        walkingTime = Math.round((distance / 5) * 60);

        // Temps à vélo : 15 km/h en vitesse moyenne
        cyclingTime = Math.round((distance / 15) * 60);

        // Temps en transport : utiliser la distance la plus courte
        // En milieu urbain : métro/bus ~20 km/h en moyenne (avec arrêts)
        // Pour les courtes distances (<2km), marcher peut être plus rapide
        if (distance < 2) {
          transitTime = walkingTime; // Marcher est plus rapide pour courtes distances
        } else {
          transitTime = Math.round((distance / 20) * 60); // 20 km/h pour transports en commun
        }
      }

      return {
        ...product,
        distance: distance ? distance.toFixed(2) : null,
        walking_time: walkingTime,
        cycling_time: cyclingTime,
        transit_time: transitTime
      };
    });

    // Filtrer par distance max si spécifié
    if (maxDistance && userLat && userLon) {
      const maxDistKm = parseFloat(maxDistance);
      products = products.filter(p => p.distance && parseFloat(p.distance) <= maxDistKm);
    }

    res.json({
      success: true,
      products,
      pagination: {
        currentPage: currentPage,
        totalPages: totalPages,
        totalProducts: totalProducts,
        limit: pageLimit,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits'
    });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const productId = req.params.id;
    const { latitude, longitude } = req.query;

    const result = await db.query(
      `SELECT
        p.id,
        p.nom,
        p.description,
        p.prix,
        p.prix_original,
        p.stock,
        p.image_url,
        p.dlc,
        p.is_disponible,
        p.is_lot,
        p.created_at,
        p.pickup_start_time,
        p.pickup_end_time,
        p.pickup_instructions,
        c.nom_commerce,
        c.adresse,
        c.latitude,
        c.longitude,
        cat.nom as category_name,
        u.prenom as vendeur_prenom,
        u.nom as vendeur_nom,
        STRING_AGG(DISTINCT i.name, ', ') as ingredient_nom,
        ARRAY_AGG(DISTINCT i.id) FILTER (WHERE i.id IS NOT NULL) as ingredient_ids
      FROM products p
      INNER JOIN users u ON p.vendeur_id = u.id
      LEFT JOIN commerces c ON u.id = c.vendeur_id
      LEFT JOIN categories cat ON p.category_id = cat.id
      LEFT JOIN product_items pi ON p.id = pi.product_id
      LEFT JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE p.id = $1
      GROUP BY p.id, c.nom_commerce, c.adresse, c.latitude, c.longitude, cat.nom, u.prenom, u.nom`,
      [productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produit introuvable'
      });
    }

    const product = result.rows[0];

    let distance = null;
    let walkingTime = null;
    let transitTime = null;
    let cyclingTime = null;
    let userLat = latitude ? parseFloat(latitude) : null;
    let userLon = longitude ? parseFloat(longitude) : null;

    if (userLat && userLon && product.latitude && product.longitude) {
      const prodLat = parseFloat(product.latitude);
      const prodLon = parseFloat(product.longitude);

      const R = 6371;
      const dLat = (prodLat - userLat) * Math.PI / 180;
      const dLon = (prodLon - userLon) * Math.PI / 180;
      const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(userLat * Math.PI / 180) * Math.cos(prodLat * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distance = R * c;

      // Temps à pied : 5 km/h en vitesse moyenne
      walkingTime = Math.round((distance / 5) * 60);

      // Temps à vélo : 15 km/h en vitesse moyenne
      cyclingTime = Math.round((distance / 15) * 60);

      // Temps en transport : utiliser la distance la plus courte
      // En milieu urbain : métro/bus ~20 km/h en moyenne (avec arrêts)
      // Pour les courtes distances (<2km), marcher peut être plus rapide
      if (distance < 2) {
        transitTime = walkingTime; // Marcher est plus rapide pour courtes distances
      } else {
        transitTime = Math.round((distance / 20) * 60); // 20 km/h pour transports en commun
      }
    }

    product.distance = distance ? distance.toFixed(2) : null;
    product.walking_time = walkingTime;
    product.cycling_time = cyclingTime;
    product.transit_time = transitTime;

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du produit'
    });
  }
});

module.exports = router;
