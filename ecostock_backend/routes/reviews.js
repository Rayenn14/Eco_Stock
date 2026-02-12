const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticateToken } = require('../middleware/auth');
const { getCache, setCache, invalidateCache } = require('../utils/cache');

// Ajouter ou mettre a jour un avis sur un commerce
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { commerce_id, note, commentaire } = req.body;
    const userId = req.user.id;

    console.log('[Reviews] POST / - user:', userId, 'commerce:', commerce_id, 'note:', note);

    // Validation
    if (!commerce_id || !note) {
      return res.status(400).json({
        success: false,
        message: 'commerce_id et note sont obligatoires'
      });
    }

    if (note < 1 || note > 5) {
      return res.status(400).json({
        success: false,
        message: 'La note doit etre entre 1 et 5'
      });
    }

    // Verifier que le commerce existe
    const commerce = await prisma.commerces.findUnique({
      where: { id: commerce_id },
      select: { id: true, vendeur_id: true },
    });

    if (!commerce) {
      return res.status(404).json({
        success: false,
        message: 'Commerce introuvable'
      });
    }

    // Empecher le vendeur de noter son propre commerce
    if (commerce.vendeur_id === userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas noter votre propre commerce'
      });
    }

    // Upsert: inserer ou mettre a jour si existe deja
    const review = await prisma.reviews.upsert({
      where: {
        reviews_unique_user_commerce: {
          user_id: userId,
          commerce_id,
        },
      },
      update: {
        note,
        commentaire: commentaire || null,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        commerce_id,
        note,
        commentaire: commentaire || null,
      },
    });

    console.log('[Reviews] Avis cree/mis a jour:', review.id);

    // Invalider le cache des stats du commerce
    await invalidateCache(`commerce:stats:${commerce_id}`);

    res.status(201).json({
      success: true,
      message: 'Avis enregistre avec succes',
      review
    });
  } catch (error) {
    console.error('[Reviews] Erreur creation avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement de l\'avis'
    });
  }
});

// Recuperer les avis d'un commerce
router.get('/commerce/:commerceId', authenticateToken, async (req, res) => {
  try {
    const { commerceId } = req.params;

    console.log('[Reviews] GET /commerce/:id -', commerceId);

    // Verifier le cache pour les stats
    const cachedStats = await getCache(`commerce:stats:${commerceId}`);

    const reviews = await prisma.reviews.findMany({
      where: { commerce_id: commerceId },
      include: {
        users: {
          select: {
            prenom: true,
            nom: true,
            photo_profil: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Formater les reviews pour correspondre au format attendu par le front
    const formattedReviews = reviews.map(r => ({
      id: r.id,
      note: r.note,
      commentaire: r.commentaire,
      created_at: r.created_at,
      updated_at: r.updated_at,
      prenom: r.users.prenom,
      nom: r.users.nom,
      photo_profil: r.users.photo_profil,
    }));

    let stats;
    if (cachedStats) {
      stats = cachedStats;
    } else {
      const aggregate = await prisma.reviews.aggregate({
        where: { commerce_id: commerceId },
        _count: true,
        _avg: { note: true },
      });

      stats = {
        total_reviews: aggregate._count || 0,
        average_rating: aggregate._avg.note ? parseFloat(aggregate._avg.note.toFixed(1)) : 0,
      };

      // Cacher les stats 5 minutes
      await setCache(`commerce:stats:${commerceId}`, stats, 300);
    }

    res.json({
      success: true,
      reviews: formattedReviews,
      stats,
    });
  } catch (error) {
    console.error('[Reviews] Erreur recuperation avis commerce:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation des avis'
    });
  }
});

// Recuperer les avis laisses par l'utilisateur connecte
router.get('/my-reviews', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('[Reviews] GET /my-reviews - user:', userId);

    const reviews = await prisma.reviews.findMany({
      where: { user_id: userId },
      include: {
        commerces: {
          select: {
            id: true,
            nom_commerce: true,
            adresse: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const formattedReviews = reviews.map(r => ({
      id: r.id,
      note: r.note,
      commentaire: r.commentaire,
      created_at: r.created_at,
      updated_at: r.updated_at,
      commerce_id: r.commerces.id,
      nom_commerce: r.commerces.nom_commerce,
      adresse: r.commerces.adresse,
    }));

    res.json({
      success: true,
      reviews: formattedReviews,
    });
  } catch (error) {
    console.error('[Reviews] Erreur recuperation mes avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation de vos avis'
    });
  }
});

// Recuperer les avis sur le commerce du vendeur connecte
router.get('/shop-reviews', authenticateToken, async (req, res) => {
  try {
    const vendeurId = req.user.id;

    console.log('[Reviews] GET /shop-reviews - vendeur:', vendeurId);

    // Verifier que l'utilisateur est vendeur
    if (req.user.user_type !== 'vendeur') {
      return res.status(403).json({
        success: false,
        message: 'Acces reserve aux vendeurs'
      });
    }

    // Recuperer le commerce du vendeur
    const commerce = await prisma.commerces.findUnique({
      where: { vendeur_id: vendeurId },
      select: { id: true, nom_commerce: true },
    });

    if (!commerce) {
      return res.json({
        success: true,
        reviews: [],
        stats: { total_reviews: 0, average_rating: 0 },
        commerce: null
      });
    }

    const reviews = await prisma.reviews.findMany({
      where: { commerce_id: commerce.id },
      include: {
        users: {
          select: {
            prenom: true,
            nom: true,
            photo_profil: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const formattedReviews = reviews.map(r => ({
      id: r.id,
      note: r.note,
      commentaire: r.commentaire,
      created_at: r.created_at,
      updated_at: r.updated_at,
      prenom: r.users.prenom,
      nom: r.users.nom,
      photo_profil: r.users.photo_profil,
    }));

    // Calculer la moyenne
    const aggregate = await prisma.reviews.aggregate({
      where: { commerce_id: commerce.id },
      _count: true,
      _avg: { note: true },
    });

    const stats = {
      total_reviews: aggregate._count || 0,
      average_rating: aggregate._avg.note ? parseFloat(aggregate._avg.note.toFixed(1)) : 0,
    };

    res.json({
      success: true,
      reviews: formattedReviews,
      stats,
      commerce,
    });
  } catch (error) {
    console.error('[Reviews] Erreur recuperation avis boutique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation des avis'
    });
  }
});

// Supprimer un avis (seul l'auteur peut supprimer)
router.delete('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    console.log('[Reviews] DELETE /:id -', reviewId, 'user:', userId);

    // Verifier que l'avis appartient a l'utilisateur
    const review = await prisma.reviews.findFirst({
      where: {
        id: reviewId,
        user_id: userId,
      },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis introuvable ou non autorise'
      });
    }

    await prisma.reviews.delete({
      where: { id: reviewId },
    });

    // Invalider le cache des stats
    await invalidateCache(`commerce:stats:${review.commerce_id}`);

    res.json({
      success: true,
      message: 'Avis supprime avec succes'
    });
  } catch (error) {
    console.error('[Reviews] Erreur suppression avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'avis'
    });
  }
});

// Verifier si l'utilisateur a deja note un commerce
router.get('/check/:commerceId', authenticateToken, async (req, res) => {
  try {
    const { commerceId } = req.params;
    const userId = req.user.id;

    const review = await prisma.reviews.findUnique({
      where: {
        reviews_unique_user_commerce: {
          user_id: userId,
          commerce_id: commerceId,
        },
      },
      select: {
        id: true,
        note: true,
        commentaire: true,
      },
    });

    res.json({
      success: true,
      hasReview: !!review,
      review: review || null,
    });
  } catch (error) {
    console.error('[Reviews] Erreur verification avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la verification'
    });
  }
});

module.exports = router;
