import express from 'express';
import { getCharges, createCharge } from '../controllers/chargeController.js';

const router = express.Router();

// Mock authentication middleware (in a real app, this would verify the JWT with Auth Service)
const mockAuth = (req, res, next) => {
  req.user = { userId: '1' };
  next();
};

router.use(mockAuth);

router.get('/', getCharges);
router.post('/', createCharge);

export default router;
