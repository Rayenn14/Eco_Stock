const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticateToken } = require('../middleware/auth');
const { uploadImage, deleteImage } = require('../services/cloudinary');
const checkExpiredProducts = require('../middleware/checkExpiredProducts');
const { getCache, setCache, invalidateCache } = require('../utils/cache');

// Vérifier les produits expirés avant chaque requête
router.use(checkExpiredProducts);

// Middleware pour vérifier que l'utilisateur soit un vendeur
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
    const { showExpired } = req.query;
    const includeExpired = showExpired === 'true';

    console.log('[Seller] GET /my-products - Fetching products for seller:', req.user.id, 'showExpired:', includeExpired);

    // Filtres d'expiration complexes -> $queryRawUnsafe
    const expirationFilter = includeExpired
      ? ''
      : `AND p.is_disponible = true
         AND p.dlc >= CURRENT_DATE
         AND (p.pickup_end_time IS NULL OR (p.created_at::date + p.pickup_end_time) > NOW())`;

    const products = await prisma.$queryRawUnsafe(
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
          WHEN (p.pickup_end_time IS NOT NULL AND (p.created_at::date + p.pickup_end_time) < NOW()) THEN 'expired'
          WHEN p.is_disponible = false THEN 'unavailable'
          WHEN p.dlc <= CURRENT_DATE + INTERVAL '3 days' THEN 'expiring_soon'
          ELSE 'active'
        END as status
      FROM products p
      LEFT JOIN categories cat ON p.category_id = cat.id
      WHERE p.vendeur_id = $1::uuid
      ${expirationFilter}
      ORDER BY p.created_at DESC`,
      req.user.id
    );

    console.log('[Seller] Found', products.length, 'products');
    res.json({
      success: true,
      products
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
      ingredient_ids,
      pickup_start_time,
      pickup_end_time,
      pickup_instructions
    } = req.body;

    // Validation du produit
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

    // Créer le produit avec Prisma
    const product = await prisma.products.create({
      data: {
        vendeur_id: req.user.id,
        category_id: category_id ? parseInt(category_id) : null,
        nom,
        description: description || null,
        prix: parseFloat(prix),
        prix_original: prix_original ? parseFloat(prix_original) : null,
        stock: parseInt(stock),
        image_url: cloudinaryImageUrl || null,
        dlc: new Date(dlc),
        is_lot: is_lot || false,
        is_disponible: true,
        reserved_for_associations: reserved_for_associations || false,
        pickup_start_time: pickup_start_time ? new Date(`1970-01-01T${pickup_start_time}Z`) : null,
        pickup_end_time: pickup_end_time ? new Date(`1970-01-01T${pickup_end_time}Z`) : null,
        pickup_instructions: pickup_instructions || null,
      },
    });

    console.log('[Seller] Product created with ID:', product.id);

    // Si c'est un lot avec plusieurs ingrédients
    if (is_lot && ingredient_ids && ingredient_ids.length > 0) {
      console.log('[Seller] Linking', ingredient_ids.length, 'ingredients to lot product', product.id);

      for (const ingredientId of ingredient_ids) {
        await prisma.product_items.create({
          data: {
            product_id: product.id,
            ingredient_id: parseInt(ingredientId),
            nom,
            quantite: 1,
            unite: 'unite',
          },
        });
      }

      console.log('[Seller] All ingredients linked successfully to lot');
    }
    // Si c'est un produit normal avec un seul ingrédient
    else if (!is_lot && ingredient_id) {
      console.log('[Seller] Linking ingredient', ingredient_id, 'to product', product.id);
      await prisma.product_items.create({
        data: {
          product_id: product.id,
          ingredient_id: parseInt(ingredient_id),
          nom,
          quantite: 1,
          unite: 'unite',
        },
      });
      console.log('[Seller] Ingredient linked successfully');
    } else {
      console.log('[Seller] No ingredient provided');
    }

    // Invalider le cache des produits
    await invalidateCache('products:*');

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
    const existing = await prisma.products.findFirst({
      where: { id: productId, vendeur_id: req.user.id },
      select: { id: true, image_url: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Produit introuvable ou non autorisé'
      });
    }

    const oldImage = existing.image_url;

    // Upload de la nouvelle image vers Cloudinary si fournie
    let cloudinaryImageUrl = image_url;
    if (image_url && image_url.startsWith('data:image')) {
      console.log('[Seller] Uploading new image to Cloudinary...');
      cloudinaryImageUrl = await uploadImage(image_url, 'ecostock/products');
      console.log('[Seller] New image uploaded:', cloudinaryImageUrl);

      if (oldImage && oldImage.includes('cloudinary.com')) {
        await deleteImage(oldImage);
        console.log('[Seller] Old image deleted from Cloudinary');
      }
    }

    // Construire les données de mise à jour (COALESCE equivalent)
    const updateData = { updated_at: new Date() };
    if (nom !== undefined) updateData.nom = nom;
    if (description !== undefined) updateData.description = description;
    if (prix !== undefined) updateData.prix = parseFloat(prix);
    if (prix_original !== undefined) updateData.prix_original = parseFloat(prix_original);
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (cloudinaryImageUrl !== undefined) updateData.image_url = cloudinaryImageUrl;
    if (dlc !== undefined) updateData.dlc = new Date(dlc);
    if (category_id !== undefined) updateData.category_id = parseInt(category_id);
    if (is_disponible !== undefined) updateData.is_disponible = is_disponible;
    if (reserved_for_associations !== undefined) updateData.reserved_for_associations = reserved_for_associations;

    const product = await prisma.products.update({
      where: { id: productId },
      data: updateData,
    });

    // Invalider le cache
    await invalidateCache('products:*');

    res.json({
      success: true,
      message: 'Produit mis à jour avec succès',
      product
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
    const existing = await prisma.products.findFirst({
      where: { id: productId, vendeur_id: req.user.id },
      select: { id: true, image_url: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Produit introuvable ou non autorisé'
      });
    }

    // Vérifier si le produit est dans une commande
    const inOrder = await prisma.commande_items.findFirst({
      where: { product_id: productId },
      select: { id: true },
    });

    if (inOrder) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer ce produit car il fait partie d\'une commande'
      });
    }

    const productImage = existing.image_url;

    // Supprimer le produit
    await prisma.products.delete({
      where: { id: productId },
    });

    // Supprimer l'image de Cloudinary si elle existe
    if (productImage && productImage.includes('cloudinary.com')) {
      await deleteImage(productImage);
      console.log('[Seller] Product image deleted from Cloudinary');
    }

    // Invalider le cache
    await invalidateCache('products:*');

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

// Récupérer les catégories disponibles (avec cache Redis)
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    // Verifier le cache (TTL: 1 heure)
    const cached = await getCache('categories:all');
    if (cached) {
      return res.json({ success: true, categories: cached });
    }

    const categories = await prisma.categories.findMany({
      select: { id: true, nom: true, description: true },
      orderBy: { nom: 'asc' },
    });

    // Cacher pour 1 heure
    await setCache('categories:all', categories, 3600);

    res.json({
      success: true,
      categories
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
      const ingredients = await prisma.ingredients.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
        take: 10,
      });

      console.log('[Seller] Returning', ingredients.length, 'default ingredients');
      return res.json({
        success: true,
        ingredients
      });
    }

    // Récupérer tous les ingrédients
    console.log('[Seller] Fetching all ingredients for fuzzy matching');
    const allIngredients = await prisma.ingredients.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    console.log('[Seller] Total ingredients in database:', allIngredients.length);

    // Utiliser le fuzzy matching
    const { findBestMatches } = require('../utils/fuzzyMatch');
    const matches = findBestMatches(
      query,
      allIngredients,
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
    const rows = await prisma.$queryRaw`
      SELECT
        c.id as commande_id,
        c.numero_commande,
        c.total,
        c.statut,
        c.stripe_payment_status,
        c.paid_at,
        c.created_at,
        u.prenom as client_prenom,
        u.nom as client_nom,
        u.email as client_email,
        u.telephone as client_telephone,
        ci.product_id,
        p.nom as product_name,
        p.image_url as product_image,
        p.dlc as product_dlc,
        ci.quantite,
        ci.prix_unitaire,
        (ci.prix_unitaire * ci.quantite) as line_total,
        p.pickup_start_time::text as pickup_start_time,
        p.pickup_end_time::text as pickup_end_time,
        p.pickup_instructions
      FROM commandes c
      INNER JOIN users u ON c.client_id = u.id
      JOIN commande_items ci ON c.id = ci.commande_id
      JOIN products p ON ci.product_id = p.id
      WHERE c.vendeur_id = ${req.user.id}::uuid
        AND c.stripe_payment_status = 'succeeded'
      ORDER BY c.created_at DESC`;

    // Grouper les produits par commande
    const ordersMap = {};
    for (const row of rows) {
      if (!ordersMap[row.commande_id]) {
        ordersMap[row.commande_id] = {
          id: row.commande_id,
          numero_commande: row.numero_commande,
          total: parseFloat(row.total),
          statut: row.statut,
          stripe_payment_status: row.stripe_payment_status,
          paid_at: row.paid_at,
          created_at: row.created_at,
          client: {
            prenom: row.client_prenom,
            nom: row.client_nom,
            email: row.client_email,
            telephone: row.client_telephone
          },
          products: []
        };
      }

      ordersMap[row.commande_id].products.push({
        id: row.product_id,
        nom: row.product_name,
        image_url: row.product_image,
        dlc: row.product_dlc,
        quantite: row.quantite,
        prix_unitaire: parseFloat(row.prix_unitaire),
        line_total: parseFloat(row.line_total),
        pickup_start_time: row.pickup_start_time,
        pickup_end_time: row.pickup_end_time,
        pickup_instructions: row.pickup_instructions
      });
    }

    res.json({
      success: true,
      orders: Object.values(ordersMap)
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
