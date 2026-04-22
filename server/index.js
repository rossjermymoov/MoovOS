import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import customersRouter from './routes/customers.js';
import staffRouter from './routes/staff.js';
import carriersRouter from './routes/carriers.js';
import customerPricingRouter from './routes/customerPricing.js';
import webhooksRouter from './routes/webhooks.js';
import { runMigrations } from './db/migrate.js';
import { seedCustomerRates } from './scripts/seedCustomerRates.js';
import customerRatesRouter from './routes/customerRates.js';
import trackingRouter, { catchUpVerified, purgeOldTrackingData } from './routes/tracking.js';
import billingRouter from './routes/billing.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// ─── Middleware ───────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(morgan(isProd ? 'combined' : 'dev'));

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/customers',        customersRouter);
app.use('/api/staff',            staffRouter);
app.use('/api/carriers',         carriersRouter);
app.use('/api/customer-pricing', customerPricingRouter);
app.use('/api/customer-rates',   customerRatesRouter);
app.use('/api/v1/webhooks',      webhooksRouter);
app.use('/api/tracking',         trackingRouter);
app.use('/api/billing',          billingRouter);

// ─── Health check ────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'moov-os' }));

// ─── Serve built React app in production ─────────────────────
if (isProd) {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ─── Error handler ───────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ─── Startup ─────────────────────────────────────────────────
async function start() {
  // Check DATABASE_URL is set before attempting anything
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set.');
    console.error('   On Railway: add a PostgreSQL plugin to your service, or set DATABASE_URL manually.');
    process.exit(1);
  }

  try {
    await runMigrations();
    await seedCustomerRates();
    await catchUpVerified();
    await purgeOldTrackingData();
    // Re-run purge every 24 hours
    setInterval(purgeOldTrackingData, 24 * 60 * 60 * 1000);
  } catch (err) {
    console.error('❌ Migration failed — server will not start.');
    console.error('   Error code:   ', err.code    || 'unknown');
    console.error('   Error detail: ', err.detail  || err.message || err);
    console.error('   Hint:         ', err.hint    || 'Check your DATABASE_URL and that your PostgreSQL service is running.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🟢 Moov OS server running on port ${PORT}`);
  });
}

start();
