const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Middleware pour vérifier que l'utilisateur est un vendeur
const isVendeur = async (req, res, next) => {
  console.log('[Seller Middleware] Checking if user is seller:', req.user.user_type);
  if (req.user.user_type !== 'vendeur') {
    console.log('[Seller Middleware] Access denied - user is not a seller');
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux vendeurs'
    });
  }
  console.log('[Seller Middleware] Access granted - user is a seller');
  next();
};

// Récupérer tous les produits du vendeur connecté
router.get('/my-products', authenticateToken, isVendeur, async (req, res) => {
  try {
    console.log('[Seller] GET /my-products - Fetching products for seller:', req.user.id);
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
        p.date_peremption,
        p.is_bio,
        p.is_local,
        p.is_disponible,
        p.is_lot,
        p.reserved_for_associations,
        p.created_at,
        p.updated_at,
        cat.nom as category_name,
        CASE
          WHEN p.dlc < CURRENT_DATE THEN 'expired'
          WHEN p.dlc <= CURRENT_DATE + INTERVAL '3 days' THEN 'expiring_soon'
          ELSE 'active'
        END as status
      FROM products p
      LEFT JOIN categories cat ON p.category_id = cat.id
      WHERE p.vendeur_id = $1
      ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    console.log('[Seller] Found', result.rows.length, 'products');
    res.json({
      success: true,
      products: result.rows
    });
  } catch (error) {
    console.error('[Seller] Error fetching seller products:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits'
    });
  }
});

// Ajouter un nouveau produit
router.post('/products', authenticateToken, isVendeur, async (req, res) => {
  try {
    console.log('[Seller] POST /products - Adding new product');
    console.log('[Seller] Request body:', JSON.stringify(req.body, null, 2));

    const {
      nom,
      description,
      prix,
      prix_original,
      stock,
      image_url,
      dlc,
      category_id,
      is_bio,
      is_local,
      reserved_for_associations,
      ingredient_id
    } = req.body;

    // Validation
    if (!nom || !prix || !stock || !dlc) {
      console.log('[Seller] Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Nom, prix, stock et date limite sont obligatoires'
      });
    }

    // Vérifier que la DLC n'est pas déjà passée
    const dlcDate = new Date(dlc);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dlcDate < today) {
      return res.status(400).json({
        success: false,
        message: 'La date limite de consommation ne peut pas être dans le passé'
      });
    }

    // Créer le produit
    const result = await db.query(
      `INSERT INTO products (
        vendeur_id,
        category_id,
        nom,
        description,
        prix,
        prix_original,
        stock,
        image_url,
        dlc,
        is_bio,
        is_local,
        is_disponible,
        reserved_for_associations
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, $12)
      RETURNING *`,
      [
        req.user.id,
        category_id || null,
        nom,
        description || null,
        prix,
        prix_original || null,
        stock,
        image_url || null,
        dlc,
        is_bio || false,
        is_local || false,
        reserved_for_associations || false
      ]
    );

    const product = result.rows[0];
    console.log('[Seller] Product created with ID:', product.id);

    // Si un ingrédient est fourni, créer la liaison dans product_items
    if (ingredient_id) {
      console.log('[Seller] Linking ingredient', ingredient_id, 'to product', product.id);
      await db.query(
        `INSERT INTO product_items (product_id, ingredient_id, nom, quantite, unite)
         VALUES ($1, $2, $3, 1, 'unite')`,
        [product.id, ingredient_id, nom]
      );
      console.log('[Seller] Ingredient linked successfully');
    } else {
      console.log('[Seller] No ingredient provided');
    }

    console.log('[Seller] Product creation successful');
    res.status(201).json({
      success: true,
      message: 'Produit ajouté avec succès',
      product: product
    });
  } catch (error) {
    console.error('[Seller] Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du produit'
    });
  }
});

// Modifier un produit
router.put('/products/:id', authenticateToken, isVendeur, async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      nom,
      description,
      prix,
      prix_original,
      stock,
      image_url,
      dlc,
      category_id,
      is_bio,
      is_local,
      is_disponible,
      reserved_for_associations
    } = req.body;

    // Vérifier que le produit appartient au vendeur
    const checkResult = await db.query(
      'SELECT id FROM products WHERE id = $1 AND vendeur_id = $2',
      [productId, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produit introuvable ou non autorisé'
      });
    }

    const result = await db.query(
      `UPDATE products SET
        nom = COALESCE($1, nom),
        description = COALESCE($2, description),
        prix = COALESCE($3, prix),
        prix_original = COALESCE($4, prix_original),
        stock = COALESCE($5, stock),
        image_url = COALESCE($6, image_url),
        dlc = COALESCE($7, dlc),
        category_id = COALESCE($8, category_id),
        is_bio = COALESCE($9, is_bio),
        is_local = COALESCE($10, is_local),
        is_disponible = COALESCE($11, is_disponible),
        reserved_for_associations = COALESCE($12, reserved_for_associations),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13 AND vendeur_id = $14
      RETURNING *`,
      [
        nom,
        description,
        prix,
        prix_original,
        stock,
        image_url,
        dlc,
        category_id,
        is_bio,
        is_local,
        is_disponible,
        reserved_for_associations,
        productId,
        req.user.id
      ]
    );

    res.json({
      success: true,
      message: 'Produit mis à jour avec succès',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du produit'
    });
  }
});

// Supprimer un produit
router.delete('/products/:id', authenticateToken, isVendeur, async (req, res) => {
  try {
    const productId = req.params.id;

    // Vérifier que le produit appartient au vendeur
    const checkResult = await db.query(
      'SELECT id FROM products WHERE id = $1 AND vendeur_id = $2',
      [productId, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produit introuvable ou non autorisé'
      });
    }

    await db.query(
      'DELETE FROM products WHERE id = $1 AND vendeur_id = $2',
      [productId, req.user.id]
    );

    res.json({
      success: true,
      message: 'Produit supprimé avec succès'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du produit'
    });
  }
});

// Récupérer les catégories disponibles
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, nom, description FROM categories ORDER BY nom'
    );

    res.json({
      success: true,
      categories: result.rows
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories'
    });
  }
});

// Rechercher des ingrédients avec fuzzy matching
router.get('/ingredients/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    console.log('[Seller] GET /ingredients/search - Query:', query);

    if (!query || query.trim().length < 2) {
      console.log('[Seller] No query or query too short - returning first 10 ingredients');
      // Retourner les 10 premiers ingrédients si pas de recherche
      const result = await db.query(
        'SELECT id, name FROM ingredients ORDER BY name LIMIT 10'
      );

      console.log('[Seller] Returning', result.rows.length, 'default ingredients');
      return res.json({
        success: true,
        ingredients: result.rows
      });
    }

    // Récupérer tous les ingrédients
    console.log('[Seller] Fetching all ingredients for fuzzy matching');
    const allIngredients = await db.query(
      'SELECT id, name FROM ingredients ORDER BY name'
    );

    console.log('[Seller] Total ingredients in database:', allIngredients.rows.length);

    // Utiliser le fuzzy matching
    const { findBestMatches } = require('../utils/fuzzyMatch');
    const matches = findBestMatches(
      query,
      allIngredients.rows,
      0.5, // Seuil de similarité à 50%
      10   // Maximum 10 résultats
    );

    console.log('[Seller] Found', matches.length, 'matching ingredients');
    res.json({
      success: true,
      ingredients: matches.map(match => ({
        id: match.id,
        name: match.name,
        score: match.score
      }))
    });
  } catch (error) {
    console.error('[Seller] Error searching ingredients:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche d\'ingrédients'
    });
  }
});

// Récupérer les commandes du vendeur
router.get('/orders', authenticateToken, isVendeur, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
        l.id,
        l.numero_lot,
        l.total,
        l.statut,
        l.mode_recuperation,
        l.adresse_livraison,
        l.date_recuperation,
        l.message_client,
        l.created_at,
        u.prenom as client_prenom,
        u.nom as client_nom,
        u.email as client_email,
        u.telephone as client_telephone
      FROM lots l
      INNER JOIN users u ON l.client_id = u.id
      WHERE l.vendeur_id = $1
      ORDER BY l.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      orders: result.rows
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes'
    });
  }
});

// Mettre à jour le statut d'une commande
router.put('/orders/:id/status', authenticateToken, isVendeur, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { statut, message_vendeur } = req.body;

    const validStatuts = ['en_attente', 'confirmee', 'en_preparation', 'prete', 'livree', 'annulee'];

    if (!validStatuts.includes(statut)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    // Vérifier que la commande appartient au vendeur
    const checkResult = await db.query(
      'SELECT id FROM lots WHERE id = $1 AND vendeur_id = $2',
      [orderId, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commande introuvable ou non autorisée'
      });
    }

    const result = await db.query(
      `UPDATE lots SET
        statut = $1,
        message_vendeur = COALESCE($2, message_vendeur),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND vendeur_id = $4
      RETURNING *`,
      [statut, message_vendeur, orderId, req.user.id]
    );

    res.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
});

module.exports = router;
