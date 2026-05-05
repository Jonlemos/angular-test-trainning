import express from 'express';
import { login, verifyMFA, validateToken, refreshToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/mfa/verify', verifyMFA);
router.post('/validate', validateToken);
router.post('/refresh', refreshToken);

export default router;
