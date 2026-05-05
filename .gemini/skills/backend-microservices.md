# Backend Microservices Architecture (Node.js + Express)

## Overview
This skill covers the implementation of Node.js microservices for the Itaú PJ Dashboard, following RESTful API design, security best practices, and scalable architecture patterns [web:90][web:93].

## Architecture Overview
┌─────────────────────────────────────────────────────────┐
│ API Gateway (Port 3000)                                 │
│ (Optional - for production)                             │
└────────────────┬────────────────────────────────────────┘
                 │  
    ┌─────────────┬──────────────┬────────────┐
    │             │              │            │
    ▼             ▼              ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Auth     │ │ Charge   │ │ Renego-  │ │ DB       │
│ Service  │ │ Service  │ │ tiation  │ │ (JSON)   │
│ :3001    │ │ :3002    │ │ Service  │ │ :3004    │
│          │ │          │ │ :3003    │ │          │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

## Project Structure

apps/backend/
├── auth-service/
│ ├── src/
│ │ ├── controllers/
│ │ │ └── authController.js
│ │ ├── middlewares/
│ │ │ ├── authMiddleware.js
│ │ │ └── errorMiddleware.js
│ │ ├── routes/
│ │ │ └── authRoutes.js
│ │ ├── utils/
│ │ │ ├── jwt.js
│ │ │ └── validator.js
│ │ └── index.js
│ ├── _tests_/
│ │ └── auth.test.js
│ ├── package.json
│ └── server.js
├── charge-service/
│ ├── src/
│ │ ├── controllers/
│ │ │ └── chargeController.js
│ │ ├── middlewares/
│ │ ├── routes/
│ │ └── index.js
│ ├── _tests_/
│ ├── package.json
│ └── server.js
├── renegotiation-service/
│ ├── src/
│ │ ├── controllers/
│ │ ├── middlewares/
│ │ ├── routes/
│ │ └── index.js
│ ├── _tests_/
│ ├── package.json
│ └── server.js
├── db/
│ ├── db.json
│ └── package.json
└── docker-compose.yml


## Auth Service Implementation

### 1. Package.json (Updated Dependencies)

```json
{
  "name": "auth-service",
  "version": "2.0.0",
  "description": "Authentication microservice for Itaú PJ Dashboard",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "NODE_ENV=test node --experimental-vm-modules node_modules/jest/bin/jest.js",
    "test:watch": "npm run test -- --watch",
    "test:coverage": "npm run test -- --coverage"
  },
  "keywords": ["auth", "jwt", "microservice"],
  "author": "Itaú Tech",
  "license": "ISC",
  "dependencies": {
    "axios": "^1.7.9",
    "body-parser": "^1.20.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "express-rate-limit": "^7.5.0",
    "helmet": "^8.0.0",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "axios-mock-adapter": "^2.2.0",
    "jest": "^29.7.0",
    "nodemon": "^3.1.9",
    "supertest": "^7.0.0"
  }
}
```

### 2. Server.js (Entry Point)

```javascript
// apps/backend/auth-service/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import authRoutes from './src/routes/authRoutes.js';
import { errorMiddleware } from './src/middlewares/errorMiddleware.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:4200', 'http://localhost:4201'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Muitas tentativas. Tente novamente mais tarde.'
});
app.use('/api', limiter);

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);

// Error handling
app.use(errorMiddleware);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🔐 Auth Service running on port ${PORT}`);
  });
}

export default app;
```

### 3. Auth Controller

```javascript
// apps/backend/auth-service/src/controllers/authController.js
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { generateToken, verifyToken } from '../utils/jwt.js';

// Validation schemas
const loginSchema = z.object({
  cpfCnpj: z.string().min(11).max(14).regex(/^\d+$/),
  password: z.string().min(6).max(100)
});

const mfaSchema = z.object({
  code: z.string().length(6).regex(/^\d+$/),
  sessionToken: z.string()
});

const users = [
  {
    id: '1',
    cpfCnpj: '12345678901234',
    // Always use bcrypt hashes in all environments
    password: '$2b$10$yELgt5QGfVmtfVbdMwFDyuP7pVpUOdef9vSLMpyQDvH5s/DRv6kxC', 
    name: 'Empresa Demo LTDA',
    email: 'contato@empresademo.com.br',
    cnpj: '12.345.678/0001-90',
    requiresMFA: true
  }
];

export const login = async (req, res, next) => {
  try {
    // Validate input
    const { cpfCnpj, password } = loginSchema.parse(req.body);
    
    // Find user
    const user = users.find(u => u.cpfCnpj === cpfCnpj);
    
    // MANDATORY: Use bcrypt.compare for password validation
    const isValid = user ? await bcrypt.compare(password, user.password) : false;

    if (!isValid) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'CPF/CNPJ ou senha inválidos',
          user_message: 'CPF/CNPJ ou senha inválidos. Verifique seus dados e tente novamente.'
        }
      });
    }
    
    // Check if MFA is required
    if (user.requiresMFA) {
      const sessionToken = generateToken({ userId: user.id, type: 'mfa_pending' }, '5m');
      
      return res.json({
        requiresMFA: true,
        sessionToken,
        message: 'Código de autenticação enviado para seu celular'
      });
    }
    
    // Generate JWT token
    const token = generateToken({ userId: user.id, cpfCnpj: user.cpfCnpj });
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        cnpj: user.cnpj
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados inválidos',
          details: error.errors
        }
      });
    }
    next(error);
  }
};

export const verifyMFA = async (req, res, next) => {
  try {
    const { code, sessionToken } = mfaSchema.parse(req.body);
    
    // Verify session token
    const session = verifyToken(sessionToken);
    if (!session || session.type !== 'mfa_pending') {
      return res.status(401).json({
        error: {
          code: 'INVALID_SESSION',
          message: 'Sessão inválida ou expirada'
        }
      });
    }
    
    // Verify MFA code (mock - in production use real MFA)
    if (code !== '123456') {
      return res.status(401).json({
        error: {
          code: 'INVALID_MFA_CODE',
          message: 'Código inválido'
        }
      });
    }
    
    // Find user
    const user = users.find(u => u.id === session.userId);
    
    // Generate final JWT token
    const token = generateToken({ userId: user.id, cpfCnpj: user.cpfCnpj });
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        cnpj: user.cnpj
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados inválidos',
          details: error.errors
        }
      });
    }
    next(error);
  }
};

export const validateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: {
          code: 'NO_TOKEN',
          message: 'Token não fornecido'
        }
      });
    }
    
    const decoded = verifyToken(token);
    
    res.json({
      valid: true,
      userId: decoded.userId
    });
  } catch (error) {
    res.status(401).json({
      valid: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token inválido ou expirado'
      }
    });
  }
};
```

### 4. JWT Utility

```javascript
// apps/backend/auth-service/src/utils/jwt.js
import jwt from 'jsonwebtoken';

// MANDATORY: Fail fast if JWT_SECRET is not provided
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is NOT defined.');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const generateToken = (payload, expiresIn = JWT_EXPIRES_IN) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
    issuer: 'itau-pj-api',
    audience: 'itau-pj-dashboard'
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'itau-pj-api',
      audience: 'itau-pj-dashboard'
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
};
```

### 5. Auth Middleware

```javascript
// apps/backend/auth-service/src/middlewares/authMiddleware.js
import { verifyToken } from '../utils/jwt.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ');[1]
  
  if (!token) {
    return res.status(401).json({
      error: {
        code: 'NO_TOKEN',
        message: 'Token de autenticação não fornecido'
      }
    });
  }
  
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token inválido ou expirado'
      }
    });
  }
};
```

### 6. Error Middleware

```javascript
// apps/backend/auth-service/src/middlewares/errorMiddleware.js
export const errorMiddleware = (err, req, res, next) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';
  
  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};
```

### 7. Routes

```javascript
// apps/backend/auth-service/src/routes/authRoutes.js
import express from 'express';
import { login, verifyMFA, validateToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/mfa/verify', verifyMFA);
router.post('/validate', validateToken);

export default router;
```

### 8. Tests

```javascript
// apps/backend/auth-service/__tests__/auth.test.js
import request from 'supertest';
import app from '../server.js';

describe('Auth Service', () => {
  describe('POST /api/auth/login', () => {
    it('should return MFA required for valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpfCnpj: '12345678901234',
          password: 'password123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('requiresMFA', true);
      expect(response.body).toHaveProperty('sessionToken');
    });
    
    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpfCnpj: '99999999999999',
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
  
  describe('POST /api/auth/mfa/verify', () => {
    it('should return token for valid MFA code', async () => {
      // First login to get session token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          cpfCnpj: '12345678901234',
          password: 'password123'
        });
      
      const { sessionToken } = loginResponse.body;
      
      // Verify MFA
      const mfaResponse = await request(app)
        .post('/api/auth/mfa/verify')
        .send({
          code: '123456',
          sessionToken
        });
      
      expect(mfaResponse.status).toBe(200);
      expect(mfaResponse.body).toHaveProperty('token');
      expect(mfaResponse.body).toHaveProperty('user');
    });
  });
});
```

## Charge Service (Similar Structure)

```javascript
// apps/backend/charge-service/src/controllers/chargeController.js
import axios from 'axios';

const DB_URL = process.env.DB_URL || 'http://localhost:3004';

export const getCharges = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    const response = await axios.get(`${DB_URL}/charges`, {
      params: { userId }
    });
    
    res.json(response.data);
  } catch (error) {
    next(error);
  }
};

export const createCharge = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const chargeData = {
      ...req.body,
      userId,
      createdAt: new Date().toISOString()
    };
    
    const response = await axios.post(`${DB_URL}/charges`, chargeData);
    
    res.status(201).json(response.data);
  } catch (error) {
    next(error);
  }
};
```

## Database Service (JSON Server)

```json
// apps/backend/db/db.json
{
  "users": [
    {
      "id": "1",
      "cpfCnpj": "12345678901234",
      "name": "Empresa Demo LTDA",
      "email": "contato@empresademo.com.br",
      "cnpj": "12.345.678/0001-90"
    }
  ],
  "charges": [
    {
      "id": "1",
      "userId": "1",
      "description": "Venda produtos",
      "amount": 15000.50,
      "dueDate": "2026-05-15",
      "status": "pending",
      "createdAt": "2026-05-01T10:00:00Z"
    }
  ],
  "transactions": [
    {
      "id": "1",
      "userId": "1",
      "type": "credit",
      "amount": 5000.00,
      "description": "PIX recebido",
      "date": "2026-05-02T14:30:00Z"
    }
  ],
  "renegotiations": []
}
```

## Docker Compose (Development)

```yaml
# apps/backend/docker-compose.yml
version: '3.8'

services:
  auth-service:
    build: ./auth-service
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - JWT_SECRET=itau-dev-secret
      - NODE_ENV=development
    volumes:
      - ./auth-service:/app
      - /app/node_modules

  charge-service:
    build: ./charge-service
    ports:
      - "3002:3002"
    environment:
      - PORT=3002
      - DB_URL=http://db:3004
    depends_on:
      - db

  renegotiation-service:
    build: ./renegotiation-service
    ports:
      - "3003:3003"
    environment:
      - PORT=3003
      - DB_URL=http://db:3004
    depends_on:
      - db

  db:
    image: node:20-alpine
    working_dir: /app
    command: npm start
    ports:
      - "3004:3004"
    volumes:
      - ./db:/app
```

## Environment Variables

```bash
# apps/backend/.env.example
# Auth Service
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:4201

# Database
DB_URL=http://localhost:3004

# General
NODE_ENV=development
LOG_LEVEL=debug
```

## API Documentation Standards

Every endpoint should follow this pattern:

```javascript
/**
 * @route POST /api/auth/login
 * @description Authenticate user with CPF/CNPJ and password
 * @access Public
 * @body {string} cpfCnpj - User's CPF or CNPJ (11-14 digits)
 * @body {string} password - User's password (min 6 characters)
 * @returns {object} 200 - Login success with token or MFA requirement
 * @returns {object} 401 - Invalid credentials
 * @returns {object} 400 - Validation error
 */
```

---

*Follow these patterns to ensure secure, scalable, and maintainable microservices.*