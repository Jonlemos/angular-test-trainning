import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env['JWT_SECRET'];
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
}
const JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'] || '24h';

export const generateToken = (payload, expiresIn = JWT_EXPIRES_IN) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
    issuer: 'banco-pj-api',
    audience: 'banco-pj-dashboard'
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'banco-pj-api',
      audience: 'banco-pj-dashboard'
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
};
