const checkUserType = (...allowedTypes) => {
  return (req, res, next) => {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié. Utilisez le middleware authenticateToken avant checkUserType'
      });
    }

    // Vérifier le type d'utilisateur
    if (!allowedTypes.includes(req.user.user_type)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Cette action est réservée aux : ${allowedTypes.join(', ')}`
      });
    }

    // Type autorisé, continuer
    next();
  };
};

module.exports = { checkUserType };
