import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'renegotiation-service' });
});

app.listen(PORT, () => {
  console.log(`🤝 Renegotiation Service running on port ${PORT}`);
});
