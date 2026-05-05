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
