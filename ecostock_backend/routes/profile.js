const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');


// RÉCUPÉRER LE PROFIL

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT id, prenom, nom, email, user_type, nom_commerce, nom_association,
       phone, adresse_ligne1, adresse_ligne2, code_postal, ville, pays, profile_image
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable',
      });
    }

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
    });
  }
});


router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      prenom,
      nom,
      email,
      phone,
      nom_commerce,
      nom_association,
      adresse_ligne1,
      adresse_ligne2,
      code_postal,
      ville,
      pays
    } = req.body;

    // Validation
    if (!prenom || !nom || !email) {
      return res.status(400).json({
        success: false,
        message: 'Le prénom, nom et email sont requis',
      });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, userId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé',
      });
    }

    // Mettre à jour
    const result = await db.query(
      `UPDATE users
       SET prenom = $1, nom = $2, email = $3, phone = $4,
           nom_commerce = $5, nom_association = $6,
           adresse_ligne1 = $7, adresse_ligne2 = $8,
           code_postal = $9, ville = $10, pays = $11,
           updated_at = NOW()
       WHERE id = $12
       RETURNING id, prenom, nom, email, phone, user_type, nom_commerce, nom_association,
                 adresse_ligne1, adresse_ligne2, code_postal, ville, pays, profile_image`,
      [
        prenom,
        nom,
        email,
        phone || null,
        nom_commerce || null,
        nom_association || null,
        adresse_ligne1 || null,
        adresse_ligne2 || null,
        code_postal || null,
        ville || null,
        pays || 'France',
        userId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable',
      });
    }

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
    });
  }
});


// UPLOADER LA PHOTO DE PROFIL
router.post('/upload-image', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'Image requise',
      });
    }

    const result = await db.query(
      'UPDATE users SET profile_image = $1, updated_at = NOW() WHERE id = $2 RETURNING profile_image',
      [imageBase64, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable',
      });
    }

    res.json({
      success: true,
      message: 'Photo de profil mise à jour',
      profile_image: result.rows[0].profile_image,
    });
  } catch (error) {
    console.error('Erreur upload image:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload de l\'image',
    });
  }
});

module.exports = router;
