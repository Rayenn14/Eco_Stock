const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { uploadImage, deleteImage } = require('../services/cloudinary');


// RÉCUPÉRER LE PROFIL

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT id, prenom, nom, email, user_type, nom_commerce, nom_association,
       telephone, adresse, code_postal, ville, photo_profil
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
      adresse_commerce,
      nom_association,
      adresse,
      code_postal,
      ville,
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

    // Mettre à jour l'utilisateur
    const result = await db.query(
      `UPDATE users
       SET prenom = $1, nom = $2, email = $3, telephone = $4,
           nom_association = $5, adresse = $6,
           code_postal = $7, ville = $8,
           updated_at = NOW()
       WHERE id = $9
       RETURNING id, prenom, nom, email, telephone, user_type, nom_association,
                 adresse, code_postal, ville, photo_profil`,
      [
        prenom,
        nom,
        email,
        phone || null,
        nom_association || null,
        adresse || null,
        code_postal || null,
        ville || null,
        userId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable',
      });
    }

    const user = result.rows[0];

    // Si l'utilisateur est un vendeur, mettre à jour la table commerces
    if (user.user_type === 'vendeur' && nom_commerce && adresse_commerce) {
      // Vérifier si le commerce existe déjà
      const commerceCheck = await db.query(
        'SELECT id FROM commerces WHERE vendeur_id = $1',
        [userId]
      );

      if (commerceCheck.rows.length > 0) {
        // Mise à jour du commerce existant
        await db.query(
          `UPDATE commerces
           SET nom_commerce = $1, adresse = $2, updated_at = NOW()
           WHERE vendeur_id = $3`,
          [nom_commerce, adresse_commerce, userId]
        );
      } else {
        // Création d'un nouveau commerce
        await db.query(
          `INSERT INTO commerces (vendeur_id, nom_commerce, adresse)
           VALUES ($1, $2, $3)`,
          [userId, nom_commerce, adresse_commerce]
        );
      }

      // Ajouter les infos du commerce dans la réponse
      user.nom_commerce = nom_commerce;
      user.adresse_commerce = adresse_commerce;
    }

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user,
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

    // Récupérer l'ancienne image pour la supprimer si elle existe
    const userResult = await db.query(
      'SELECT photo_profil FROM users WHERE id = $1',
      [userId]
    );

    const oldImage = userResult.rows[0]?.photo_profil;

    // Upload vers Cloudinary
    const imageUrl = await uploadImage(imageBase64, 'ecostock/profiles', `profile_${userId}`);

    // Mettre à jour l'URL dans la base de données
    const result = await db.query(
      'UPDATE users SET photo_profil = $1, updated_at = NOW() WHERE id = $2 RETURNING photo_profil',
      [imageUrl, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable',
      });
    }

    // Supprimer l'ancienne image de Cloudinary si elle existe et est différente
    if (oldImage && oldImage !== imageUrl && oldImage.includes('cloudinary.com')) {
      await deleteImage(oldImage);
    }

    res.json({
      success: true,
      message: 'Photo de profil mise à jour',
      imageUrl: result.rows[0].photo_profil,
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
