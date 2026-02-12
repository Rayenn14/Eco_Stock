const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticateToken } = require('../middleware/auth');
const { uploadImage, deleteImage } = require('../services/cloudinary');


// RÉCUPÉRER LE PROFIL
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        user_type: true,
        nom_association: true,
        telephone: true,
        adresse: true,
        code_postal: true,
        ville: true,
        photo_profil: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable',
      });
    }
    res.json({
      success: true,
      user,
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
    const existingUser = await prisma.users.findFirst({
      where: {
        email,
        NOT: { id: userId },
      },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé',
      });
    }

    // Mettre à jour l'utilisateur
    const user = await prisma.users.update({
      where: { id: userId },
      data: {
        prenom,
        nom,
        email,
        telephone: phone || null,
        nom_association: nom_association || null,
        adresse: adresse || null,
        code_postal: code_postal || null,
        ville: ville || null,
        updated_at: new Date(),
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        telephone: true,
        user_type: true,
        nom_association: true,
        adresse: true,
        code_postal: true,
        ville: true,
        photo_profil: true,
      },
    });

    // Si l'utilisateur est un vendeur, mettre à jour la table commerces
    if (user.user_type === 'vendeur' && nom_commerce && adresse_commerce) {
      const existingCommerce = await prisma.commerces.findUnique({
        where: { vendeur_id: userId },
      });

      if (existingCommerce) {
        await prisma.commerces.update({
          where: { vendeur_id: userId },
          data: {
            nom_commerce,
            adresse: adresse_commerce,
            updated_at: new Date(),
          },
        });
      } else {
        await prisma.commerces.create({
          data: {
            vendeur_id: userId,
            nom_commerce,
            adresse: adresse_commerce,
          },
        });
      }

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
    const currentUser = await prisma.users.findUnique({
      where: { id: userId },
      select: { photo_profil: true },
    });

    const oldImage = currentUser?.photo_profil;

    // Upload vers Cloudinary
    const imageUrl = await uploadImage(imageBase64, 'ecostock/profiles', `profile_${userId}`);

    // Mettre à jour l'URL dans la base de données
    const updated = await prisma.users.update({
      where: { id: userId },
      data: {
        photo_profil: imageUrl,
        updated_at: new Date(),
      },
      select: { photo_profil: true },
    });

    // Supprimer l'ancienne image de Cloudinary si elle existe et est différente
    if (oldImage && oldImage !== imageUrl && oldImage.includes('cloudinary.com')) {
      await deleteImage(oldImage);
    }

    res.json({
      success: true,
      message: 'Photo de profil mise à jour',
      imageUrl: updated.photo_profil,
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
