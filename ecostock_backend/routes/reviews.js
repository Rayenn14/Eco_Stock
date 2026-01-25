const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

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
    const commerceCheck = await db.query(
      'SELECT id, vendeur_id FROM commerces WHERE id = $1',
      [commerce_id]
    );

    if (commerceCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commerce introuvable'
      });
    }

    // Empecher le vendeur de noter son propre commerce
    if (commerceCheck.rows[0].vendeur_id === userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas noter votre propre commerce'
      });
    }

    // Upsert: inserer ou mettre a jour si existe deja
    const result = await db.query(
      `INSERT INTO reviews (user_id, commerce_id, note, commentaire)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, commerce_id)
       DO UPDATE SET note = $3, commentaire = $4, updated_at = NOW()
       RETURNING *`,
      [userId, commerce_id, note, commentaire || null]
    );

    console.log('[Reviews] Avis cree/mis a jour:', result.rows[0].id);

    res.status(201).json({
      success: true,
      message: 'Avis enregistre avec succes',
      review: result.rows[0]
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

    const result = await db.query(
      `SELECT
        r.id,
        r.note,
        r.commentaire,
        r.created_at,
        r.updated_at,
        u.prenom,
        u.nom,
        u.photo_profil
       FROM reviews r
       INNER JOIN users u ON r.user_id = u.id
       WHERE r.commerce_id = $1
       ORDER BY r.created_at DESC`,
      [commerceId]
    );

    // Calculer la moyenne
    const avgResult = await db.query(
      `SELECT
        COUNT(*) as total_reviews,
        ROUND(AVG(note)::numeric, 1) as average_rating
       FROM reviews
       WHERE commerce_id = $1`,
      [commerceId]
    );

    const stats = avgResult.rows[0];

    res.json({
      success: true,
      reviews: result.rows,
      stats: {
        total_reviews: parseInt(stats.total_reviews) || 0,
        average_rating: parseFloat(stats.average_rating) || 0
      }
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

    const result = await db.query(
      `SELECT
        r.id,
        r.note,
        r.commentaire,
        r.created_at,
        r.updated_at,
        c.id as commerce_id,
        c.nom_commerce,
        c.adresse
       FROM reviews r
       INNER JOIN commerces c ON r.commerce_id = c.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      reviews: result.rows
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
    const commerceResult = await db.query(
      'SELECT id, nom_commerce FROM commerces WHERE vendeur_id = $1',
      [vendeurId]
    );

    if (commerceResult.rows.length === 0) {
      return res.json({
        success: true,
        reviews: [],
        stats: { total_reviews: 0, average_rating: 0 },
        commerce: null
      });
    }

    const commerce = commerceResult.rows[0];

    const result = await db.query(
      `SELECT
        r.id,
        r.note,
        r.commentaire,
        r.created_at,
        r.updated_at,
        u.prenom,
        u.nom,
        u.photo_profil
       FROM reviews r
       INNER JOIN users u ON r.user_id = u.id
       WHERE r.commerce_id = $1
       ORDER BY r.created_at DESC`,
      [commerce.id]
    );

    // Calculer la moyenne
    const avgResult = await db.query(
      `SELECT
        COUNT(*) as total_reviews,
        ROUND(AVG(note)::numeric, 1) as average_rating
       FROM reviews
       WHERE commerce_id = $1`,
      [commerce.id]
    );

    const stats = avgResult.rows[0];

    res.json({
      success: true,
      reviews: result.rows,
      stats: {
        total_reviews: parseInt(stats.total_reviews) || 0,
        average_rating: parseFloat(stats.average_rating) || 0
      },
      commerce: commerce
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
    const checkResult = await db.query(
      'SELECT id FROM reviews WHERE id = $1 AND user_id = $2',
      [reviewId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Avis introuvable ou non autorise'
      });
    }

    await db.query('DELETE FROM reviews WHERE id = $1', [reviewId]);

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

    const result = await db.query(
      'SELECT id, note, commentaire FROM reviews WHERE user_id = $1 AND commerce_id = $2',
      [userId, commerceId]
    );

    res.json({
      success: true,
      hasReview: result.rows.length > 0,
      review: result.rows[0] || null
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
