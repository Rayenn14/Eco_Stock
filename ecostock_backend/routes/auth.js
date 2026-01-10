const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

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

    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query('BEGIN');

    try {
      const userResult = await db.query(
        `INSERT INTO users
         (prenom, nom, email, password, user_type, nom_association)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, prenom, nom, email, user_type, nom_association`,
        [prenom || null, nom || null, email, hashedPassword, user_type, nom_association || null]
      );

      const user = userResult.rows[0];

      let commerce = null;
      if (user_type === 'vendeur') {
        const commerceResult = await db.query(
          `INSERT INTO commerces
           (vendeur_id, nom_commerce, adresse, latitude, longitude)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, nom_commerce, adresse, latitude, longitude`,
          [user.id, nom_commerce, adresse_commerce, latitude || null, longitude || null]
        );
        commerce = commerceResult.rows[0];
      }

      await db.query('COMMIT');

      const token = jwt.sign(
        { userId: user.id, userType: user.user_type },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '90d' }
      );

      res.status(201).json({
        success: true,
        message: 'Inscription réussie',
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
      await db.query('ROLLBACK');
      throw error;
    }

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

    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const user = result.rows[0];

    let commerce = null;
    if (user.user_type === 'vendeur') {
      const commerceResult = await db.query(
        'SELECT nom_commerce, adresse FROM commerces WHERE vendeur_id = $1',
        [user.id]
      );
      if (commerceResult.rows.length > 0) {
        commerce = commerceResult.rows[0];
      }
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

    // Vérifier et décoder le token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    // Récupérer l'utilisateur
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const user = result.rows[0];

    // Vérifier le mot de passe actuel
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await db.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedNewPassword, user.id]
    );

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
