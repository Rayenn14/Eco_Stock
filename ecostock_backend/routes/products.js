const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Route de recherche de produits
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query, latitude, longitude } = req.query;

    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        products: []
      });
    }

    const searchQuery = query.trim();

    // Recherche par nom de produit OU ingrédients
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
        GREATEST(
          SIMILARITY(p.nom, $1),
          MAX(SIMILARITY(i.name, $1))
        ) as score
      FROM products p
      INNER JOIN users u ON p.vendeur_id = u.id
      LEFT JOIN commerces c ON u.id = c.vendeur_id
      LEFT JOIN categories cat ON p.category_id = cat.id
      LEFT JOIN product_items pi ON p.id = pi.product_id
      LEFT JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE p.is_disponible = true
        AND p.stock > 0
        AND (
          p.nom ILIKE '%' || $1 || '%'
          OR i.name ILIKE '%' || $1 || '%'
          OR SIMILARITY(p.nom, $1) > 0.3
          OR SIMILARITY(i.name, $1) > 0.3
        )
      GROUP BY p.id, c.nom_commerce, c.adresse, c.latitude, c.longitude, cat.nom, u.prenom, u.nom
      ORDER BY score DESC, p.created_at DESC
      LIMIT 50`,
      [searchQuery]
    );

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
      products
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
    const { latitude, longitude, category, minPrice, maxPrice, maxDaysUntilDlc, maxDistance } = req.query;

    // Build WHERE conditions
    const conditions = ['p.is_disponible = true', 'p.stock > 0'];
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

    if (maxDaysUntilDlc) {
      params.push(parseInt(maxDaysUntilDlc));
      conditions.push(`p.dlc <= CURRENT_DATE + INTERVAL '1 day' * $${paramIndex++}`);
    }

    const whereClause = conditions.join(' AND ');

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
      ORDER BY p.created_at DESC`,
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
      products
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
