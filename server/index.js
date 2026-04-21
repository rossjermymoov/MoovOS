import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import customersRouter from './routes/customers.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(morgan('dev'));

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/customers', customersRouter);

// ─── Health check ────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'moov-os' }));

// ─── Error handler ───────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🟢 Moov OS server running on port ${PORT}`);
});
