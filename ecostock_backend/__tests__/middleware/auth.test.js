/**
 * Tests pour le middleware d'authentification
 */

const jwt = require('jsonwebtoken');

// Mock de la base de données
jest.mock('../../config/database', () => ({
  query: jest.fn(),
}));

const db = require('../../config/database');
const { authenticateToken } = require('../../middleware/auth');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-ci';

describe('Middleware: authenticateToken', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('Token Validation', () => {
    it('should reject request without authorization header', async () => {
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token manquant'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with empty token', async () => {
      req.headers.authorization = 'Bearer ';

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token manquant'
      });
    });

    it('should reject request with invalid token format', async () => {
      req.headers.authorization = 'Invalid token-format';

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should reject request with invalid token', async () => {
      req.headers.authorization = 'Bearer invalid.token.here';

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token invalide'
      });
    });

    it('should reject request with expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: '1', userType: 'acheteur' },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' } // Already expired
      );

      req.headers.authorization = `Bearer ${expiredToken}`;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token expiré'
      });
    });

    it('should accept valid token and set user in request', async () => {
      const validToken = jwt.sign(
        { userId: '1', userType: 'acheteur' },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      req.headers.authorization = `Bearer ${validToken}`;

      db.query.mockResolvedValueOnce({
        rows: [{
          id: '1',
          prenom: 'Jean',
          nom: 'Dupont',
          email: 'jean@example.com',
          user_type: 'acheteur'
        }]
      });

      await authenticateToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('1');
      expect(req.user.email).toBe('jean@example.com');
      expect(next).toHaveBeenCalled();
    });

    it('should reject token for non-existent user', async () => {
      const validToken = jwt.sign(
        { userId: '999', userType: 'acheteur' },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      req.headers.authorization = `Bearer ${validToken}`;
      db.query.mockResolvedValueOnce({ rows: [] });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Utilisateur introuvable'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject token for inactive user', async () => {
      const validToken = jwt.sign(
        { userId: '1', userType: 'acheteur' },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      req.headers.authorization = `Bearer ${validToken}`;

      // La requête filtre déjà is_active = true, donc rows vide
      db.query.mockResolvedValueOnce({ rows: [] });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Token Payload Validation', () => {
    it('should validate userId in token payload', async () => {
      const validToken = jwt.sign(
        { userId: '1', userType: 'vendeur' },
        process.env.JWT_SECRET
      );

      req.headers.authorization = `Bearer ${validToken}`;

      db.query.mockResolvedValueOnce({
        rows: [{
          id: '1',
          prenom: 'Marie',
          nom: 'Martin',
          email: 'marie@example.com',
          user_type: 'vendeur'
        }]
      });

      await authenticateToken(req, res, next);

      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        ['1']
      );
    });

    it('should handle different user types', async () => {
      const userTypes = ['acheteur', 'vendeur', 'association'];

      for (const userType of userTypes) {
        const token = jwt.sign(
          { userId: '1', userType },
          process.env.JWT_SECRET
        );

        req.headers.authorization = `Bearer ${token}`;

        db.query.mockResolvedValueOnce({
          rows: [{
            id: '1',
            prenom: 'Test',
            nom: 'User',
            email: 'test@example.com',
            user_type: userType
          }]
        });

        await authenticateToken(req, res, next);

        expect(req.user.user_type).toBe(userType);
        jest.clearAllMocks();
      }
    });
  });

  describe('Database Query', () => {
    it('should query database with correct user id', async () => {
      const validToken = jwt.sign(
        { userId: '42', userType: 'acheteur' },
        process.env.JWT_SECRET
      );

      req.headers.authorization = `Bearer ${validToken}`;

      db.query.mockResolvedValueOnce({
        rows: [{
          id: '42',
          prenom: 'Test',
          nom: 'User',
          email: 'test@example.com',
          user_type: 'acheteur'
        }]
      });

      await authenticateToken(req, res, next);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('is_active = true'),
        ['42']
      );
    });

    it('should only retrieve active users', async () => {
      const validToken = jwt.sign(
        { userId: '1', userType: 'acheteur' },
        process.env.JWT_SECRET
      );

      req.headers.authorization = `Bearer ${validToken}`;

      db.query.mockResolvedValueOnce({ rows: [{
        id: '1',
        prenom: 'Test',
        nom: 'User',
        email: 'test@example.com',
        user_type: 'acheteur'
      }] });

      await authenticateToken(req, res, next);

      const queryCall = db.query.mock.calls[0][0];
      expect(queryCall).toContain('is_active = true');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const validToken = jwt.sign(
        { userId: '1', userType: 'acheteur' },
        process.env.JWT_SECRET
      );

      req.headers.authorization = `Bearer ${validToken}`;

      db.query.mockRejectedValueOnce(new Error('Database connection failed'));

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erreur serveur'
      });
    });

    it('should handle malformed JWT tokens', async () => {
      req.headers.authorization = 'Bearer malformed.jwt';

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token invalide'
      });
    });
  });

  describe('Security', () => {
    it('should not expose sensitive user data', async () => {
      const validToken = jwt.sign(
        { userId: '1', userType: 'acheteur' },
        process.env.JWT_SECRET
      );

      req.headers.authorization = `Bearer ${validToken}`;

      db.query.mockResolvedValueOnce({
        rows: [{
          id: '1',
          prenom: 'Jean',
          nom: 'Dupont',
          email: 'jean@example.com',
          user_type: 'acheteur'
        }]
      });

      await authenticateToken(req, res, next);

      expect(req.user.password).toBeUndefined();
    });

    it('should verify token signature', async () => {
      const tokenWithWrongSecret = jwt.sign(
        { userId: '1', userType: 'acheteur' },
        process.env.JWT_SECRET + '-invalid-suffix'
      );

      req.headers.authorization = `Bearer ${tokenWithWrongSecret}`;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject tampered tokens', async () => {
      const validToken = jwt.sign(
        { userId: '1', userType: 'acheteur' },
        process.env.JWT_SECRET
      );

      // Tamper with the token
      const tamperedToken = validToken.slice(0, -5) + 'XXXXX';

      req.headers.authorization = `Bearer ${tamperedToken}`;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
