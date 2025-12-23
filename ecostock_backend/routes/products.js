const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
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
        p.is_bio,
        p.is_local,
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
        i.name as ingredient_nom,
        i.id as ingredient_id
      FROM products p
      INNER JOIN users u ON p.vendeur_id = u.id
      LEFT JOIN commerces c ON u.id = c.vendeur_id
      LEFT JOIN categories cat ON p.category_id = cat.id
      LEFT JOIN product_items pi ON p.id = pi.product_id
      LEFT JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE p.is_disponible = true AND p.stock > 0
      ORDER BY p.created_at DESC`
    );

    let userLat = latitude ? parseFloat(latitude) : null;
    let userLon = longitude ? parseFloat(longitude) : null;

    const products = result.rows.map(product => {
      let distance = null;
      let walkingTime = null;
      let transitTime = null;

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
        transit_time: transitTime
      };
    });

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
        p.is_bio,
        p.is_local,
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
        i.name as ingredient_nom,
        i.id as ingredient_id
      FROM products p
      INNER JOIN users u ON p.vendeur_id = u.id
      LEFT JOIN commerces c ON u.id = c.vendeur_id
      LEFT JOIN categories cat ON p.category_id = cat.id
      LEFT JOIN product_items pi ON p.id = pi.product_id
      LEFT JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE p.id = $1`,
      [productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produit introuvable'
      });
    }

    const product = result.rows[0];

    if (product.is_lot) {
      const lotItems = await db.query(
        `SELECT
          p.id,
          p.nom,
          p.description,
          p.prix,
          p.prix_original,
          p.image_url,
          p.dlc,
          p.is_bio,
          p.is_local
        FROM lot_items li
        INNER JOIN products p ON li.product_id = p.id
        WHERE li.lot_id = $1`,
        [productId]
      );

      product.lot_items = lotItems.rows;
    }

    let distance = null;
    let walkingTime = null;
    let transitTime = null;
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
