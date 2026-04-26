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
import billingRouter, { runBillingCycle } from './routes/billing.js';
import { query as dbQuery } from './db/index.js';
import carrierRateCardsRouter, { activateDueCarrierRateCards } from './routes/carrierRateCards.js';
import customerRateCardsRouter from './routes/customerRateCards.js';
import carrierDataRouter from './routes/carrierData.js';
import queriesRouter from './routes/queries.js';
import surchargesRouter from './routes/surcharges.js';
import customerCarrierLinksRouter from './routes/customerCarrierLinks.js';
import slaRulesRouter from './routes/slaRules.js';
import katanaRouter from './routes/katana.js';
import pricingRouter from './routes/pricing.js';
import xeroRouter from './routes/xero.js';
import reconciliationRouter from './routes/reconciliation.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// ─── Middleware ───────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' })); // larger limit for CSV import payloads
app.use(morgan(isProd ? 'combined' : 'dev'));

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/customers',             customersRouter);
app.use('/api/staff',                 staffRouter);
app.use('/api/carriers',              carriersRouter);
app.use('/api/customer-pricing',      customerPricingRouter);
app.use('/api/customer-rates',        customerRatesRouter);
app.use('/api/v1/webhooks',           webhooksRouter);
app.use('/api/tracking',              trackingRouter);
app.use('/api/billing',               billingRouter);
app.use('/api/carrier-rate-cards',    carrierRateCardsRouter);
app.use('/api/customer-rate-cards',   customerRateCardsRouter);
app.use('/api/carrier-data',          carrierDataRouter);
app.use('/api/queries',               queriesRouter);
app.use('/api/surcharges',            surchargesRouter);
app.use('/api/customer-carrier-links', customerCarrierLinksRouter);
app.use('/api/sla',                   slaRulesRouter);
app.use('/api/katana',                katanaRouter);
app.use('/api/pricing',               pricingRouter);
app.use('/api/xero',                  xeroRouter);
app.use('/api/reconciliation',        reconciliationRouter);
// Webhook-safe alias — suppliers that block URLs containing "billing"
// should send to /api/moov-charges/webhook instead
app.use('/api/moov-charges',          billingRouter);

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
    await activateDueCarrierRateCards();
    // Re-run purge every 24 hours
    setInterval(purgeOldTrackingData, 24 * 60 * 60 * 1000);
    // Re-check rate card activation every 24 hours (catches date-boundary activations)
    setInterval(activateDueCarrierRateCards, 24 * 60 * 60 * 1000);
    // Billing cycle scheduler — checks every minute whether a billing run is due
    startBillingScheduler();
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

// ─── Billing cycle scheduler ─────────────────────────────────────────────────
// Checks every minute whether a billing run is due based on billing_settings.
// Runs the cycle at most once per day to prevent double-firing on server restart.

function startBillingScheduler() {
  let lastRunDate = null; // track date string 'YYYY-MM-DD' of last automatic run

  setInterval(async () => {
    try {
      const settingsRes = await dbQuery(`SELECT * FROM billing_settings WHERE id = 1`);
      const s = settingsRes.rows[0];
      if (!s || !s.enabled) return;

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      // Already ran today — skip
      if (lastRunDate === todayStr) return;

      // Check time match
      if (now.getDay()     !== s.billing_day_of_week) return;
      if (now.getHours()   !== s.billing_hour)        return;
      if (now.getMinutes() !== s.billing_minute)      return;

      console.log(`⏰ Billing scheduler: running cycle for ${todayStr}`);
      lastRunDate = todayStr;

      const result = await runBillingCycle(now);
      await dbQuery(`UPDATE billing_settings SET last_run_at = NOW() WHERE id = 1`);
      console.log(`✅ Billing cycle complete — ${result.charges_queued} charges queued across ${result.customers_processed} customers`);
    } catch (err) {
      console.error('❌ Billing scheduler error:', err.message);
    }
  }, 60 * 1000); // every minute

  console.log('🗓️  Billing scheduler started');
}

start();
