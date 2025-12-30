const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { body, validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/payment/create-intent
 * Créer un PaymentIntent Stripe pour une commande
 */
router.post('/create-intent',
  authenticateToken,
  [
    body('items').isArray().notEmpty().withMessage('Liste d\'items requise'),
    body('total').isFloat({ min: 0.5 }).withMessage('Montant total invalide')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { items, total } = req.body;
      const client_id = req.user.id;

      console.log(`[Payment] Création PaymentIntent pour client ${client_id}, items:`, items, 'montant: €${total}');

      // Extraire les product_ids depuis items
      const product_ids = items.map(item => item.productId);

      // 1. Vérifier que tous les produits existent et sont disponibles
      const productsQuery = await db.query(
        `SELECT id, nom, prix, stock, is_disponible, vendeur_id
         FROM products
         WHERE id = ANY($1::uuid[])`,
        [product_ids]
      );

      if (productsQuery.rows.length !== product_ids.length) {
        return res.status(400).json({
          success: false,
          message: 'Certains produits n\'existent pas'
        });
      }

      // Vérifier disponibilité et stock
      for (const item of items) {
        const product = productsQuery.rows.find(p => p.id === item.productId);
        if (!product) {
          return res.status(400).json({
            success: false,
            message: 'Produit introuvable'
          });
        }
        if (!product.is_disponible) {
          return res.status(400).json({
            success: false,
            message: `Le produit "${product.nom}" n'est plus disponible`
          });
        }
        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Stock insuffisant pour "${product.nom}" (demandé: ${item.quantity}, disponible: ${product.stock})`
          });
        }
      }

      // Vérifier que tous les produits ont le même vendeur
      const vendeurs = [...new Set(productsQuery.rows.map(p => p.vendeur_id))];
      if (vendeurs.length > 1) {
        return res.status(400).json({
          success: false,
          message: 'Tous les produits doivent provenir du même vendeur'
        });
      }
      const vendeur_id = vendeurs[0];

      // 2. Créer la commande dans la base de données
      const commandeQuery = await db.query(
        `INSERT INTO commandes (client_id, vendeur_id, total, statut, stripe_payment_status)
         VALUES ($1, $2, $3, 'pending', 'pending')
         RETURNING id, numero_commande`,
        [client_id, vendeur_id, total]
      );

      const commande = commandeQuery.rows[0];
      console.log(`[Payment] Commande créée: ${commande.numero_commande}`);

      // 3. Ajouter les produits à la commande avec leurs quantités
      for (const item of items) {
        const product = productsQuery.rows.find(p => p.id === item.productId);
        await db.query(
          `INSERT INTO commande_items (commande_id, product_id, quantite, prix_unitaire)
           VALUES ($1, $2, $3, $4)`,
          [commande.id, item.productId, item.quantity, product.prix]
        );
        console.log(`[Payment] Ajout item: produit ${product.nom}, quantité: ${item.quantity}`);
      }

      // 4. Créer le PaymentIntent Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(total) * 100), // Stripe utilise les centimes
        currency: 'eur',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          commande_id: commande.id,
          numero_commande: commande.numero_commande,
          client_id: client_id
        }
      });

      console.log(`[Payment] PaymentIntent créé: ${paymentIntent.id}`);

      // 5. Sauvegarder le PaymentIntent ID dans la commande
      await db.query(
        `UPDATE commandes
         SET stripe_payment_intent_id = $1
         WHERE id = $2`,
        [paymentIntent.id, commande.id]
      );

      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        commande_id: commande.id,
        numero_commande: commande.numero_commande
      });

    } catch (error) {
      console.error('[Payment] Erreur création PaymentIntent:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du paiement',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/payment/confirm
 * Confirmer le paiement après succès Stripe (sans webhook)
 */
router.post('/confirm',
  authenticateToken,
  [
    body('payment_intent_id').notEmpty().withMessage('Payment Intent ID requis')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { payment_intent_id } = req.body;
      const client_id = req.user.id;

      console.log(`[Payment] Confirmation paiement pour PaymentIntent: ${payment_intent_id}`);

      // Vérifier le statut du paiement sur Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({
          success: false,
          message: 'Le paiement n\'a pas encore été confirmé par Stripe',
          status: paymentIntent.status
        });
      }

      // Mettre à jour la commande
      const result = await db.query(
        `UPDATE commandes
         SET stripe_payment_status = 'succeeded',
             statut = 'paid',
             paid_at = NOW()
         WHERE stripe_payment_intent_id = $1 AND client_id = $2
         RETURNING *`,
        [payment_intent_id, client_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Commande introuvable'
        });
      }

      const commande = result.rows[0];
      console.log(`[Payment] Commande confirmée: ${commande.numero_commande}`);

      // Mettre à jour le stock des produits achetés
      const itemsQuery = await db.query(
        `SELECT product_id, COALESCE(quantite, 1) as quantite FROM commande_items WHERE commande_id = $1`,
        [commande.id]
      );

      for (const item of itemsQuery.rows) {
        const quantite = item.quantite;

        // Décrémenter le stock et marquer comme indisponible si stock atteint 0
        // NOTE: On ne touche PAS à sold_to_user_id car plusieurs clients peuvent acheter le même produit
        // Les ventes sont trackées dans commande_items, pas dans products
        const updateResult = await db.query(
          `UPDATE products
           SET stock = GREATEST(stock - $2, 0),
               is_disponible = CASE
                 WHEN GREATEST(stock - $2, 0) <= 0 THEN false
                 ELSE true
               END
           WHERE id = $1
           RETURNING id, stock, is_disponible`,
          [item.product_id, quantite]
        );

        const newStock = updateResult.rows[0]?.stock;
        const disponible = updateResult.rows[0]?.is_disponible;
        console.log(`[Payment] Produit ${item.product_id}: quantité achetée=${quantite}, nouveau stock=${newStock}, disponible=${disponible}`);
      }

      res.json({
        success: true,
        message: 'Paiement confirmé avec succès',
        commande: commande
      });

    } catch (error) {
      console.error('[Payment] Erreur confirmation:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la confirmation du paiement',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/payment/orders
 * Récupérer toutes les commandes de l'utilisateur connecté
 */
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const client_id = req.user.id;

    console.log('[Payment] Récupération des commandes pour client:', client_id);
    console.log('[Payment] User email:', req.user.email);

    // Récupérer les commandes avec leurs produits (requête directe sans vue)
    const ordersQuery = await db.query(
      `SELECT
        c.id as commande_id,
        c.numero_commande,
        c.total,
        c.statut,
        c.stripe_payment_status,
        c.paid_at,
        c.created_at,
        c.picked_up,
        u_vendeur.nom as vendeur_nom,
        u_vendeur.prenom as vendeur_prenom,
        u_vendeur.email as vendeur_email,
        com.nom_commerce,
        com.adresse as commerce_address,
        com.latitude as commerce_latitude,
        com.longitude as commerce_longitude,
        ci.product_id,
        p.nom as product_name,
        p.image_url as product_image,
        p.dlc as product_dlc,
        ci.quantite,
        ci.prix_unitaire,
        (ci.prix_unitaire * ci.quantite) as line_total,
        p.pickup_start_time,
        p.pickup_end_time,
        p.pickup_instructions
      FROM commandes c
      JOIN users u_vendeur ON c.vendeur_id = u_vendeur.id
      LEFT JOIN commerces com ON c.vendeur_id = com.vendeur_id
      JOIN commande_items ci ON c.id = ci.commande_id
      JOIN products p ON ci.product_id = p.id
      WHERE c.client_id = $1
        AND c.stripe_payment_status = 'succeeded'
      ORDER BY c.created_at DESC`,
      [client_id]
    );

    console.log('[Payment] Nombre de lignes trouvées:', ordersQuery.rows.length);

    // Grouper les produits par commande
    const ordersMap = {};
    for (const row of ordersQuery.rows) {
      if (!ordersMap[row.commande_id]) {
        ordersMap[row.commande_id] = {
          id: row.commande_id,
          numero_commande: row.numero_commande,
          total: parseFloat(row.total),
          statut: row.statut,
          stripe_payment_status: row.stripe_payment_status,
          paid_at: row.paid_at,
          created_at: row.created_at,
          picked_up: row.picked_up || false,
          vendeur: {
            nom: row.vendeur_nom,
            prenom: row.vendeur_prenom,
            email: row.vendeur_email
          },
          commerce: {
            nom: row.nom_commerce,
            adresse: row.commerce_address,
            latitude: row.commerce_latitude ? parseFloat(row.commerce_latitude) : null,
            longitude: row.commerce_longitude ? parseFloat(row.commerce_longitude) : null
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

    const orders = Object.values(ordersMap);

    console.log('[Payment] Nombre de commandes groupées:', orders.length);

    res.json({
      success: true,
      orders: orders
    });

  } catch (error) {
    console.error('[Payment] Erreur récupération commandes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes',
      error: error.message
    });
  }
});

/**
 * GET /api/payment/debug-orders
 * Route de debug pour voir TOUTES les commandes (temporaire)
 */
router.get('/debug-orders', authenticateToken, async (req, res) => {
  try {
    const client_id = req.user.id;

    const allOrders = await db.query(
      `SELECT
        c.id,
        c.numero_commande,
        c.client_id,
        c.total,
        c.stripe_payment_status,
        c.statut,
        c.stripe_payment_intent_id,
        c.created_at,
        (SELECT COUNT(*) FROM commande_items WHERE commande_id = c.id) as nb_items
       FROM commandes c
       WHERE c.client_id = $1
       ORDER BY c.created_at DESC
       LIMIT 10`,
      [client_id]
    );

    res.json({
      success: true,
      client_id: client_id,
      total_orders: allOrders.rows.length,
      orders: allOrders.rows
    });

  } catch (error) {
    console.error('[Payment] Erreur debug:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/payment/cleanup-pending
 * Supprimer les commandes pending de plus de 1 heure (nettoyage)
 */
router.delete('/cleanup-pending', authenticateToken, async (req, res) => {
  try {
    const client_id = req.user.id;

    // Supprimer les commandes pending de plus de 1 heure pour cet utilisateur
    const result = await db.query(
      `DELETE FROM commandes
       WHERE client_id = $1
         AND stripe_payment_status = 'pending'
         AND created_at < NOW() - INTERVAL '1 hour'
       RETURNING numero_commande`,
      [client_id]
    );

    console.log(`[Payment] ${result.rows.length} commandes pending supprimées pour client ${client_id}`);

    res.json({
      success: true,
      deleted_count: result.rows.length
    });

  } catch (error) {
    console.error('[Payment] Erreur nettoyage commandes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du nettoyage',
      error: error.message
    });
  }
});

/**
 * PUT /api/payment/orders/:orderId/picked-up
 * Marquer une commande comme récupérée (client uniquement)
 */
router.put('/orders/:orderId/picked-up', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { picked_up } = req.body;
    const client_id = req.user.id;

    console.log(`[Payment] Mise à jour picked_up=${picked_up} pour commande ${orderId} par client ${client_id}`);

    // Vérifier que la commande appartient bien au client
    const result = await db.query(
      `UPDATE commandes
       SET picked_up = $1
       WHERE id = $2 AND client_id = $3
       RETURNING *`,
      [picked_up, orderId, client_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commande introuvable ou vous n\'êtes pas autorisé'
      });
    }

    res.json({
      success: true,
      message: picked_up ? 'Commande marquée comme récupérée' : 'Commande marquée comme non récupérée',
      order: result.rows[0]
    });

  } catch (error) {
    console.error('[Payment] Erreur mise à jour picked_up:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour',
      error: error.message
    });
  }
});

/**
 * GET /api/payment/seller-orders
 * Récupérer toutes les ventes du vendeur connecté
 */
router.get('/seller-orders', authenticateToken, async (req, res) => {
  try {
    const vendeur_id = req.user.id;

    console.log('[Payment] Récupération des ventes pour vendeur:', vendeur_id);

    // Récupérer les commandes où l'utilisateur est le vendeur
    const ordersQuery = await db.query(
      `SELECT
        c.id as commande_id,
        c.numero_commande,
        c.total,
        c.statut,
        c.stripe_payment_status,
        c.paid_at,
        c.created_at,
        u_client.nom as client_nom,
        u_client.prenom as client_prenom,
        u_client.email as client_email,
        ci.product_id,
        p.nom as product_name,
        p.image_url as product_image,
        p.dlc as product_dlc,
        ci.quantite,
        ci.prix_unitaire,
        (ci.prix_unitaire * ci.quantite) as line_total
      FROM commandes c
      JOIN users u_client ON c.client_id = u_client.id
      JOIN commande_items ci ON c.id = ci.commande_id
      JOIN products p ON ci.product_id = p.id
      WHERE c.vendeur_id = $1
        AND c.stripe_payment_status = 'succeeded'
      ORDER BY c.created_at DESC`,
      [vendeur_id]
    );

    console.log('[Payment] Nombre de lignes trouvées:', ordersQuery.rows.length);

    // Grouper les produits par commande
    const ordersMap = {};
    for (const row of ordersQuery.rows) {
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
            nom: row.client_nom,
            prenom: row.client_prenom,
            email: row.client_email
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
        line_total: parseFloat(row.line_total)
      });
    }

    const orders = Object.values(ordersMap);

    console.log('[Payment] Nombre de ventes groupées:', orders.length);

    res.json({
      success: true,
      orders: orders
    });

  } catch (error) {
    console.error('[Payment] Erreur récupération ventes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des ventes',
      error: error.message
    });
  }
});

module.exports = router;
