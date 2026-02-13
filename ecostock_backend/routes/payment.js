const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
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

      console.log(`[Payment] Création PaymentIntent pour client ${client_id}, items:`, items, 'montant: ${total}');

      const product_ids = items.map(item => item.productId);

      // 1. Vérifier que tous les produits existent et sont disponibles
      const products = await prisma.products.findMany({
        where: { id: { in: product_ids } },
        select: { id: true, nom: true, prix: true, stock: true, is_disponible: true, vendeur_id: true },
      });

      if (products.length !== product_ids.length) {
        return res.status(400).json({
          success: false,
          message: 'Certains produits n\'existent pas'
        });
      }

      // Vérifier disponibilité et stock
      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
          return res.status(400).json({ success: false, message: 'Produit introuvable' });
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
      const vendeurs = [...new Set(products.map(p => p.vendeur_id))];
      if (vendeurs.length > 1) {
        return res.status(400).json({
          success: false,
          message: 'Tous les produits doivent provenir du même vendeur'
        });
      }
      const vendeur_id = vendeurs[0];

      // 2. Créer la commande + items dans une transaction Prisma
      const commande = await prisma.$transaction(async (tx) => {
        // La commande (numero_commande sera genere par le trigger DB)
        const cmd = await tx.commandes.create({
          data: {
            client_id,
            vendeur_id,
            total: Number.parseFloat(total),
            statut: 'pending',
            stripe_payment_status: 'pending',
          },
          select: { id: true, numero_commande: true },
        });

        // Les items
        for (const item of items) {
          const product = products.find(p => p.id === item.productId);
          await tx.commande_items.create({
            data: {
              commande_id: cmd.id,
              product_id: item.productId,
              quantite: item.quantity,
              prix_unitaire: product.prix,
            },
          });
        }

        return cmd;
      });

      console.log(`[Payment] Commande créée: ${commande.numero_commande}`);

      // 3. Créer le PaymentIntent Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number.parseFloat(total) * 100),
        currency: 'eur',
        automatic_payment_methods: { enabled: true },
        metadata: {
          commande_id: commande.id,
          numero_commande: commande.numero_commande,
          client_id,
        }
      });

      console.log(`[Payment] PaymentIntent créé: ${paymentIntent.id}`);

      // 4. Sauvegarder le PaymentIntent ID
      await prisma.commandes.update({
        where: { id: commande.id },
        data: { stripe_payment_intent_id: paymentIntent.id },
      });

      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        commande_id: commande.id,
        numero_commande: commande.numero_commande,
      });

    } catch (error) {
      console.error('[Payment] Erreur création PaymentIntent:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du paiement',
        error: error.message,
      });
    }
  }
);

/**
 * POST /api/payment/confirm
 */
router.post('/confirm',
  authenticateToken,
  [body('payment_intent_id').notEmpty().withMessage('Payment Intent ID requis')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { payment_intent_id } = req.body;
      const client_id = req.user.id;

      console.log(`[Payment] Confirmation paiement pour PaymentIntent: ${payment_intent_id}`);

      const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({
          success: false,
          message: 'Le paiement n\'a pas encore été confirmé par Stripe',
          status: paymentIntent.status,
        });
      }

      // Mettre à jour la commande
      const commande = await prisma.commandes.updateMany({
        where: {
          stripe_payment_intent_id: payment_intent_id,
          client_id,
        },
        data: {
          stripe_payment_status: 'succeeded',
          statut: 'paid',
          paid_at: new Date(),
        },
      });

      if (commande.count === 0) {
        return res.status(404).json({
          success: false,
          message: 'Commande introuvable',
        });
      }

      // Recuperer la commande pour l'ID
      const updatedCommande = await prisma.commandes.findFirst({
        where: { stripe_payment_intent_id: payment_intent_id, client_id },
      });

      console.log(`[Payment] Commande confirmée: ${updatedCommande.numero_commande}`);

      // Mettre à jour le stock
      const orderItems = await prisma.commande_items.findMany({
        where: { commande_id: updatedCommande.id },
        select: { product_id: true, quantite: true },
      });

      for (const item of orderItems) {
        const quantite = item.quantite || 1;

        await prisma.$queryRaw`
          UPDATE products
          SET stock = GREATEST(stock - ${quantite}, 0),
              is_disponible = CASE
                WHEN GREATEST(stock - ${quantite}, 0) <= 0 THEN false
                ELSE true
              END
          WHERE id = ${item.product_id}::uuid`;

        console.log(`[Payment] Produit ${item.product_id}: quantité achetée=${quantite}`);
      }

      res.json({
        success: true,
        message: 'Paiement confirmé avec succès',
        commande: updatedCommande,
      });

    } catch (error) {
      console.error('[Payment] Erreur confirmation:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la confirmation du paiement',
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/payment/orders
 */
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const client_id = req.user.id;

    const rows = await prisma.$queryRaw`
      SELECT
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
        p.pickup_start_time::text as pickup_start_time,
        p.pickup_end_time::text as pickup_end_time,
        p.pickup_instructions
      FROM commandes c
      JOIN users u_vendeur ON c.vendeur_id = u_vendeur.id
      LEFT JOIN commerces com ON c.vendeur_id = com.vendeur_id
      JOIN commande_items ci ON c.id = ci.commande_id
      JOIN products p ON ci.product_id = p.id
      WHERE c.client_id = ${client_id}::uuid
        AND c.stripe_payment_status = 'succeeded'
      ORDER BY c.created_at DESC`;

    // Grouper les produits par commande
    const ordersMap = {};
    for (const row of rows) {
      if (!ordersMap[row.commande_id]) {
        ordersMap[row.commande_id] = {
          id: row.commande_id,
          numero_commande: row.numero_commande,
          total: Number.parseFloat(row.total),
          statut: row.statut,
          stripe_payment_status: row.stripe_payment_status,
          paid_at: row.paid_at,
          created_at: row.created_at,
          picked_up: row.picked_up || false,
          vendeur: {
            nom: row.vendeur_nom,
            prenom: row.vendeur_prenom,
            email: row.vendeur_email,
          },
          commerce: {
            nom: row.nom_commerce,
            adresse: row.commerce_address,
            latitude: row.commerce_latitude ? Number.parseFloat(row.commerce_latitude) : null,
            longitude: row.commerce_longitude ? Number.parseFloat(row.commerce_longitude) : null,
          },
          products: [],
        };
      }

      ordersMap[row.commande_id].products.push({
        id: row.product_id,
        nom: row.product_name,
        image_url: row.product_image,
        dlc: row.product_dlc,
        quantite: row.quantite,
        prix_unitaire: Number.parseFloat(row.prix_unitaire),
        line_total: Number.parseFloat(row.line_total),
        pickup_start_time: row.pickup_start_time,
        pickup_end_time: row.pickup_end_time,
        pickup_instructions: row.pickup_instructions,
      });
    }

    res.json({
      success: true,
      orders: Object.values(ordersMap),
    });

  } catch (error) {
    console.error('[Payment] Erreur récupération commandes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes',
      error: error.message,
    });
  }
});

/**
 * GET /api/payment/debug-orders
 */
router.get('/debug-orders', authenticateToken, async (req, res) => {
  try {
    const client_id = req.user.id;

    const orders = await prisma.commandes.findMany({
      where: { client_id },
      select: {
        id: true,
        numero_commande: true,
        client_id: true,
        total: true,
        stripe_payment_status: true,
        statut: true,
        stripe_payment_intent_id: true,
        created_at: true,
        _count: { select: { commande_items: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 10,
    });

    res.json({
      success: true,
      client_id,
      total_orders: orders.length,
      orders: orders.map(o => ({
        ...o,
        nb_items: o._count.commande_items,
        _count: undefined,
      })),
    });

  } catch (error) {
    console.error('[Payment] Erreur debug:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/payment/cleanup-pending
 */
router.delete('/cleanup-pending', authenticateToken, async (req, res) => {
  try {
    const client_id = req.user.id;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const result = await prisma.commandes.deleteMany({
      where: {
        client_id,
        stripe_payment_status: 'pending',
        created_at: { lt: oneHourAgo },
      },
    });

    console.log(`[Payment] ${result.count} commandes pending supprimées pour client ${client_id}`);

    res.json({
      success: true,
      deleted_count: result.count,
    });

  } catch (error) {
    console.error('[Payment] Erreur nettoyage commandes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du nettoyage',
      error: error.message,
    });
  }
});

/**
 * PUT /api/payment/orders/:orderId/picked-up
 */
router.put('/orders/:orderId/picked-up', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { picked_up } = req.body;
    const client_id = req.user.id;

    console.log(`[Payment] Mise à jour picked_up=${picked_up} pour commande ${orderId}`);

    const result = await prisma.commandes.updateMany({
      where: { id: orderId, client_id },
      data: { picked_up },
    });

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commande introuvable ou vous n\'êtes pas autorisé',
      });
    }

    const order = await prisma.commandes.findUnique({ where: { id: orderId } });

    res.json({
      success: true,
      message: picked_up ? 'Commande marquée comme récupérée' : 'Commande marquée comme non récupérée',
      order,
    });

  } catch (error) {
    console.error('[Payment] Erreur mise à jour picked_up:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour',
      error: error.message,
    });
  }
});

/**
 * GET /api/payment/seller-orders
 */
router.get('/seller-orders', authenticateToken, async (req, res) => {
  try {
    const vendeur_id = req.user.id;

    const rows = await prisma.$queryRaw`
      SELECT
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
      WHERE c.vendeur_id = ${vendeur_id}::uuid
        AND c.stripe_payment_status = 'succeeded'
      ORDER BY c.created_at DESC`;

    const ordersMap = {};
    for (const row of rows) {
      if (!ordersMap[row.commande_id]) {
        ordersMap[row.commande_id] = {
          id: row.commande_id,
          numero_commande: row.numero_commande,
          total: Number.parseFloat(row.total),
          statut: row.statut,
          stripe_payment_status: row.stripe_payment_status,
          paid_at: row.paid_at,
          created_at: row.created_at,
          client: {
            nom: row.client_nom,
            prenom: row.client_prenom,
            email: row.client_email,
          },
          products: [],
        };
      }

      ordersMap[row.commande_id].products.push({
        id: row.product_id,
        nom: row.product_name,
        image_url: row.product_image,
        dlc: row.product_dlc,
        quantite: row.quantite,
        prix_unitaire: Number.parseFloat(row.prix_unitaire),
        line_total: Number.parseFloat(row.line_total),
      });
    }

    res.json({
      success: true,
      orders: Object.values(ordersMap),
    });

  } catch (error) {
    console.error('[Payment] Erreur récupération ventes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des ventes',
      error: error.message,
    });
  }
});

module.exports = router;
