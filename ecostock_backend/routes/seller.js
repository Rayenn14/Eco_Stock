const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { uploadImage, deleteImage } = require('../services/cloudinary');

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
        p.is_disponible,
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
      is_lot,
      reserved_for_associations,
      ingredient_id,
      ingredient_ids
    } = req.body;

    // Validation
    if (!nom || !prix || !stock || !dlc) {
      console.log('[Seller] Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Nom, prix, stock et date limite sont obligatoires'
      });
    }

    if (!description || !description.trim()) {
      console.log('[Seller] Validation failed - missing description');
      return res.status(400).json({
        success: false,
        message: 'La description est obligatoire. Veuillez indiquer les quantités et détails du produit (ex: "1kg de tomates", "Lot de 3 pommes")'
      });
    }

    // Vérifier que la DLC n'est pas déjà passée ou aujourd'hui
    const dlcDate = new Date(dlc);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dlcDate <= today) {
      return res.status(400).json({
        success: false,
        message: 'La date limite de consommation doit être au moins demain'
      });
    }

    // Upload de l'image vers Cloudinary si fournie
    let cloudinaryImageUrl = null;
    if (image_url) {
      console.log('[Seller] Uploading image to Cloudinary...');
      cloudinaryImageUrl = await uploadImage(image_url, 'ecostock/products');
      console.log('[Seller] Image uploaded:', cloudinaryImageUrl);
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
        is_lot,
        is_disponible,
        reserved_for_associations
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11)
      RETURNING *`,
      [
        req.user.id,
        category_id || null,
        nom,
        description || null,
        prix,
        prix_original || null,
        stock,
        cloudinaryImageUrl || null,
        dlc,
        is_lot || false,
        reserved_for_associations || false
      ]
    );

    const product = result.rows[0];
    console.log('[Seller] Product created with ID:', product.id);

    // Si c'est un lot avec plusieurs ingrédients
    if (is_lot && ingredient_ids && ingredient_ids.length > 0) {
      console.log('[Seller] Linking', ingredient_ids.length, 'ingredients to lot product', product.id);

      for (const ingredientId of ingredient_ids) {
        await db.query(
          `INSERT INTO product_items (product_id, ingredient_id, nom, quantite, unite)
           VALUES ($1, $2, $3, 1, 'unite')`,
          [product.id, ingredientId, nom]
        );
      }

      console.log('[Seller] All ingredients linked successfully to lot');
    }
    // Si c'est un produit normal avec un seul ingrédient
    else if (!is_lot && ingredient_id) {
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
      is_disponible,
      reserved_for_associations
    } = req.body;

    // Vérifier que le produit appartient au vendeur et récupérer l'ancienne image
    const checkResult = await db.query(
      'SELECT id, image_url FROM products WHERE id = $1 AND vendeur_id = $2',
      [productId, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produit introuvable ou non autorisé'
      });
    }

    const oldImage = checkResult.rows[0].image_url;

    // Upload de la nouvelle image vers Cloudinary si fournie
    let cloudinaryImageUrl = image_url;
    if (image_url && image_url.startsWith('data:image')) {
      console.log('[Seller] Uploading new image to Cloudinary...');
      cloudinaryImageUrl = await uploadImage(image_url, 'ecostock/products');
      console.log('[Seller] New image uploaded:', cloudinaryImageUrl);

      // Supprimer l'ancienne image de Cloudinary si elle existe
      if (oldImage && oldImage.includes('cloudinary.com')) {
        await deleteImage(oldImage);
        console.log('[Seller] Old image deleted from Cloudinary');
      }
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
        is_disponible = COALESCE($9, is_disponible),
        reserved_for_associations = COALESCE($10, reserved_for_associations),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11 AND vendeur_id = $12
      RETURNING *`,
      [
        nom,
        description,
        prix,
        prix_original,
        stock,
        cloudinaryImageUrl,
        dlc,
        category_id,
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

    // Vérifier que le produit appartient au vendeur et récupérer l'image
    const checkResult = await db.query(
      'SELECT id, image_url FROM products WHERE id = $1 AND vendeur_id = $2',
      [productId, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produit introuvable ou non autorisé'
      });
    }

    const productImage = checkResult.rows[0].image_url;

    // Supprimer le produit de la base de données
    await db.query(
      'DELETE FROM products WHERE id = $1 AND vendeur_id = $2',
      [productId, req.user.id]
    );

    // Supprimer l'image de Cloudinary si elle existe
    if (productImage && productImage.includes('cloudinary.com')) {
      await deleteImage(productImage);
      console.log('[Seller] Product image deleted from Cloudinary');
    }

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
        l.numero_commande,
        l.total,
        l.date_debut_recuperation,
        l.date_fin_recuperation,
        l.created_at,
        u.prenom as client_prenom,
        u.nom as client_nom,
        u.email as client_email,
        u.telephone as client_telephone
      FROM commandes l
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

module.exports = router;
