/**
 * Tests pour les routes d'authentification
 */

const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock de la base de données
jest.mock('../../config/database', () => ({
  query: jest.fn(),
}));

const db = require('../../config/database');
const authRouter = require('../../routes/auth');

// Configuration de l'application de test
const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

// Configuration des variables d'environnement
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRE = '7d';

describe('Routes: Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new acheteur successfully', async () => {
      // Mock de la vérification d'email existant (pas trouvé)
      db.query.mockResolvedValueOnce({ rows: [] });

      // Mock de l'insertion utilisateur
      db.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      db.query.mockResolvedValueOnce({
        rows: [{
          id: '1',
          prenom: 'Jean',
          nom: 'Dupont',
          email: 'jean@example.com',
          user_type: 'acheteur',
          nom_association: null
        }]
      });
      db.query.mockResolvedValueOnce({ rows: [] }); // COMMIT

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          prenom: 'Jean',
          nom: 'Dupont',
          email: 'jean@example.com',
          password: 'password123',
          user_type: 'acheteur'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Inscription réussie');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toMatchObject({
        id: '1',
        email: 'jean@example.com',
        user_type: 'acheteur'
      });
    });

    it('should register a vendeur with commerce', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // Check email
      db.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      db.query.mockResolvedValueOnce({
        rows: [{
          id: '2',
          prenom: 'Marie',
          nom: 'Martin',
          email: 'marie@example.com',
          user_type: 'vendeur',
          nom_association: null
        }]
      });
      db.query.mockResolvedValueOnce({
        rows: [{
          id: '1',
          nom_commerce: 'Épicerie Bio',
          adresse: '123 Rue Test',
          latitude: 48.8566,
          longitude: 2.3522
        }]
      });
      db.query.mockResolvedValueOnce({ rows: [] }); // COMMIT

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          prenom: 'Marie',
          nom: 'Martin',
          email: 'marie@example.com',
          password: 'password123',
          user_type: 'vendeur',
          nom_commerce: 'Épicerie Bio',
          adresse_commerce: '123 Rue Test',
          latitude: 48.8566,
          longitude: 2.3522
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.user_type).toBe('vendeur');
      expect(response.body.user.nom_commerce).toBe('Épicerie Bio');
    });

    it('should reject registration with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'password123',
          user_type: 'acheteur'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });

    it('should reject registration with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          user_type: 'acheteur'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('mot de passe');
    });

    it('should reject vendeur registration without commerce details', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'vendeur@example.com',
          password: 'password123',
          user_type: 'vendeur'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('commerce');
    });

    it('should reject registration with existing email', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: '1' }]
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          user_type: 'acheteur'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('déjà utilisé');
    });
  });

  describe('POST /api/auth/login', () => {
    const hashedPassword = bcrypt.hashSync('password123', 10);

    it('should login successfully with valid credentials', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{
          id: '1',
          prenom: 'Jean',
          nom: 'Dupont',
          email: 'jean@example.com',
          password: hashedPassword,
          user_type: 'acheteur',
          is_active: true,
          nom_association: null
        }]
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jean@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Connexion réussie');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('jean@example.com');
    });

    it('should login vendeur and return commerce info', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{
          id: '2',
          prenom: 'Marie',
          nom: 'Martin',
          email: 'marie@example.com',
          password: hashedPassword,
          user_type: 'vendeur',
          is_active: true,
          nom_association: null
        }]
      });
      db.query.mockResolvedValueOnce({
        rows: [{
          nom_commerce: 'Épicerie Bio',
          adresse: '123 Rue Test'
        }]
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'marie@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.nom_commerce).toBe('Épicerie Bio');
      expect(response.body.user.adresse_commerce).toBe('123 Rue Test');
    });

    it('should reject login with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email');
    });

    it('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject login with non-existent email', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'notfound@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('incorrect');
    });

    it('should reject login with incorrect password', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{
          id: '1',
          email: 'jean@example.com',
          password: hashedPassword,
          is_active: true
        }]
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jean@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('incorrect');
    });

    it('should reject login for inactive account', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{
          id: '1',
          email: 'jean@example.com',
          password: hashedPassword,
          is_active: false,
          user_type: 'acheteur'
        }]
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jean@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('désactivé');
    });
  });

  describe('POST /api/auth/change-password', () => {
    const hashedPassword = bcrypt.hashSync('currentPassword', 10);
    const validToken = jwt.sign(
      { userId: '1', userType: 'acheteur' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    it('should change password successfully', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{
          id: '1',
          email: 'jean@example.com',
          password: hashedPassword
        }]
      });
      db.query.mockResolvedValueOnce({ rows: [] }); // UPDATE

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          currentPassword: 'currentPassword',
          newPassword: 'newPassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('modifié avec succès');
    });

    it('should reject change without token', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'currentPassword',
          newPassword: 'newPassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token manquant');
    });

    it('should reject with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          currentPassword: 'currentPassword',
          newPassword: 'newPassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('invalide');
    });

    it('should reject with missing currentPassword', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          newPassword: 'newPassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject with missing newPassword', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          currentPassword: 'currentPassword'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject newPassword shorter than 6 characters', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          currentPassword: 'currentPassword',
          newPassword: '12345'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('6 caractères');
    });

    it('should reject with incorrect current password', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{
          id: '1',
          email: 'jean@example.com',
          password: hashedPassword
        }]
      });

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          currentPassword: 'wrongPassword',
          newPassword: 'newPassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('actuel incorrect');
    });

    it('should reject for non-existent user', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          currentPassword: 'currentPassword',
          newPassword: 'newPassword123'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('non trouvé');
    });
  });

  describe('JWT Token Validation', () => {
    it('should generate valid JWT token on registration', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      db.query.mockResolvedValueOnce({ rows: [] });
      db.query.mockResolvedValueOnce({
        rows: [{
          id: '1',
          prenom: 'Test',
          nom: 'User',
          email: 'test@example.com',
          user_type: 'acheteur',
          nom_association: null
        }]
      });
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          user_type: 'acheteur'
        });

      const token = response.body.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.userId).toBe('1');
      expect(decoded.userType).toBe('acheteur');
    });

    it('should generate valid JWT token on login', async () => {
      const hashedPassword = bcrypt.hashSync('password123', 10);

      db.query.mockResolvedValueOnce({
        rows: [{
          id: '1',
          email: 'test@example.com',
          password: hashedPassword,
          user_type: 'acheteur',
          is_active: true,
          prenom: 'Test',
          nom: 'User',
          nom_association: null
        }]
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      const token = response.body.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.userId).toBe('1');
      expect(decoded.userType).toBe('acheteur');
    });
  });

  describe('Password Security', () => {
    it('should hash password on registration', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      db.query.mockResolvedValueOnce({ rows: [] });

      let capturedHashedPassword;
      db.query.mockImplementationOnce((query, params) => {
        capturedHashedPassword = params[3]; // password is 4th param
        return Promise.resolve({
          rows: [{
            id: '1',
            prenom: 'Test',
            nom: 'User',
            email: 'test@example.com',
            user_type: 'acheteur',
            nom_association: null
          }]
        });
      });
      db.query.mockResolvedValueOnce({ rows: [] });

      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'plainPassword123',
          user_type: 'acheteur'
        });

      expect(capturedHashedPassword).not.toBe('plainPassword123');
      expect(capturedHashedPassword.startsWith('$2a$')).toBe(true);
    });

    it('should hash new password on password change', async () => {
      const hashedPassword = bcrypt.hashSync('currentPassword', 10);
      const validToken = jwt.sign(
        { userId: '1', userType: 'acheteur' },
        process.env.JWT_SECRET
      );

      db.query.mockResolvedValueOnce({
        rows: [{
          id: '1',
          password: hashedPassword
        }]
      });

      let capturedNewHashedPassword;
      db.query.mockImplementationOnce((query, params) => {
        capturedNewHashedPassword = params[0]; // new password is 1st param
        return Promise.resolve({ rows: [] });
      });

      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          currentPassword: 'currentPassword',
          newPassword: 'newPlainPassword123'
        });

      expect(capturedNewHashedPassword).not.toBe('newPlainPassword123');
      expect(capturedNewHashedPassword.startsWith('$2a$')).toBe(true);
    });
  });
});
