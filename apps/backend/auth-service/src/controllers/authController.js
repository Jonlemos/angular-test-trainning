import jwt from 'jsonwebtoken';
import { z } from 'zod';
import bcrypt from 'bcrypt';
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

// Removed hardcoded users. Now fetching from db (json-server on port 3004).

export const login = async (req, res, next) => {
  try {
    // Validate input
    const { cpfCnpj, password } = loginSchema.parse(req.body);
    
    // Find user in database
    const dbResponse = await fetch(`http://localhost:3004/users`);
    const users = await dbResponse.json();
    const user = users.find(u => u.cpfCnpj === cpfCnpj);
    
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'CPF/CNPJ ou senha inválidos',
          user_message: 'CPF/CNPJ ou senha inválidos. Verifique seus dados e tente novamente.'
        }
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
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
    
    // Find user in database
    const dbResponse = await fetch(`http://localhost:3004/users/${session.userId}`);
    if (!dbResponse.ok) throw new Error('User not found');
    const user = await dbResponse.json();
    
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

export const refreshToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: { code: 'NO_TOKEN', message: 'Token não fornecido' }
      });
    }

    // Validate current token
    const decoded = verifyToken(token);

    // Re-validate user still exists in DB
    const dbResponse = await fetch(`http://localhost:3004/users/${decoded.userId}`);
    if (!dbResponse.ok) {
      return res.status(401).json({
        error: { code: 'USER_NOT_FOUND', message: 'Usuário não encontrado' }
      });
    }

    const user = await dbResponse.json();

    // Issue a fresh JWT with a renewed expiry
    const newToken = generateToken({ userId: user.id, cpfCnpj: user.cpfCnpj });

    res.json({
      token: newToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        cnpj: user.cnpj
      }
    });
  } catch (error) {
    res.status(401).json({
      error: {
        code: 'REFRESH_FAILED',
        message: 'Não foi possível renovar a sessão. Faça login novamente.'
      }
    });
  }
};
