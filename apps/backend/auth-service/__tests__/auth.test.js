import request from 'supertest';
import { jest } from '@jest/globals';

// Mock global fetch BEFORE importing app
global.fetch = jest.fn();

import app from '../server.js';

describe('Auth Service', () => {
  const mockUser = {
    id: "1",
    cpfCnpj: "00000000000191",
    // Hash for "password123"
    password: "$2b$10$yELgt5QGfVmtfVbdMwFDyuP7pVpUOdef9vSLMpyQDvH5s/DRv6kxC",
    name: "Empresa Demo LTDA",
    email: "contato@empresademo.com.br",
    cnpj: "00.000.000/0001-91",
    requiresMFA: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should return token for valid credentials (MFA disabled)', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockUser]
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpfCnpj: '00000000000191',
          password: 'password123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.name).toBe(mockUser.name);
    });

    it('should return 401 for invalid password', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockUser]
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpfCnpj: '00000000000191',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 400 for invalid input format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpfCnpj: '123',
          password: 'short'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/validate', () => {
    it('should return valid true for a legitimate token', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockUser]
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ cpfCnpj: '00000000000191', password: 'password123' });
      
      const token = loginRes.body.token;

      const response = await request(app)
        .post('/api/auth/validate')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/validate')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.valid).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return a new token when valid token is provided', async () => {
      // Set a specific time
      const now = Math.floor(Date.now() / 1000);
      const originalDateNow = Date.now;
      global.Date.now = jest.fn(() => now * 1000);

      // 1. Get initial token
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockUser]
      });
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ cpfCnpj: '00000000000191', password: 'password123' });
      
      const oldToken = loginRes.body.token;

      // 2. Advance time by 1 hour for the refresh call
      global.Date.now = jest.fn(() => (now + 3600) * 1000);

      // Mock DB check for refresh
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${oldToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).not.toBe(oldToken);

      // Restore original Date.now
      global.Date.now = originalDateNow;
    });
  });
});
