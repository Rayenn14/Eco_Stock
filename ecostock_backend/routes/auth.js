const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

router.post('/register', async (req, res) => {
  try {
    const { prenom, nom, email, password, user_type, nom_commerce, nom_association, adresse_commerce, latitude, longitude } = req.body;

    if (!email || !password || !user_type) {
      return res.status(400).json({
        success: false,
        message: 'L\'email, le mot de passe et le type d\'utilisateur sont requis'
      });
    }

    if (user_type === 'vendeur') {
      if (!nom_commerce || !adresse_commerce) {
        return res.status(400).json({
          success: false,
          message: 'Le nom du commerce et l\'adresse sont obligatoires pour les vendeurs'
        });
      }
    }

    const existingUser = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Transaction Prisma : creer user + commerce si vendeur
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          prenom: prenom || null,
          nom: nom || null,
          email,
          password: hashedPassword,
          user_type,
          nom_association: nom_association || null,
        },
        select: {
          id: true,
          prenom: true,
          nom: true,
          email: true,
          user_type: true,
          nom_association: true,
        },
      });

      let commerce = null;
      if (user_type === 'vendeur') {
        commerce = await tx.commerces.create({
          data: {
            vendeur_id: user.id,
            nom_commerce,
            adresse: adresse_commerce,
            latitude: latitude || null,
            longitude: longitude || null,
          },
          select: {
            id: true,
            nom_commerce: true,
            adresse: true,
            latitude: true,
            longitude: true,
          },
        });
      }

      return { user, commerce };
    });

    const token = jwt.sign(
      { userId: result.user.id, userType: result.user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '90d' }
    );

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      user: {
        id: result.user.id,
        prenom: result.user.prenom,
        nom: result.user.nom,
        email: result.user.email,
        user_type: result.user.user_type,
        nom_commerce: result.commerce ? result.commerce.nom_commerce : null,
        adresse_commerce: result.commerce ? result.commerce.adresse : null,
        nom_association: result.user.nom_association,
      }
    });

  } catch (error) {
    console.error('Error registration:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    let commerce = null;
    if (user.user_type === 'vendeur') {
      commerce = await prisma.commerces.findUnique({
        where: { vendeur_id: user.id },
        select: { nom_commerce: true, adresse: true },
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const token = jwt.sign(
      { userId: user.id, userType: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '90d' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        prenom: user.prenom,
        nom: user.nom,
        email: user.email,
        user_type: user.user_type,
        nom_commerce: commerce ? commerce.nom_commerce : null,
        adresse_commerce: commerce ? commerce.adresse : null,
        nom_association: user.nom_association,
      }
    });

  } catch (error) {
    console.error('Error login:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion'
    });
  }
});

// Route pour changer le mot de passe
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe'
    });
  }
});

module.exports = router;
