import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chargeRoutes from './src/routes/chargeRoutes.js';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'charge-service' });
});

app.use('/api/charges', chargeRoutes);

app.listen(PORT, () => {
  console.log(`💰 Charge Service running on port ${PORT}`);
});
