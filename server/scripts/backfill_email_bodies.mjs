/**
 * backfill_email_bodies.mjs
 * ---------------------------------------------------------------------------
 * One-off repair: re-fetches already-imported Gmail messages and re-parses
 * their body with the corrected extractBody() (which now keeps the full HTML
 * content instead of a sparse text/plain alternative).
 *
 * Emails imported before the parsing fix often stored only a greeting
 * (e.g. "Good morning"). This script restores their real content.
 *
 * Safe to re-run: it only updates a row when the freshly-parsed body has
 * MORE content than what's currently stored.
 *
 * Usage (from the server/ directory, with the same env as the app):
 *   node scripts/backfill_email_bodies.mjs            # repair short/suspect rows
 *   node scripts/backfill_email_bodies.mjs --all      # re-parse every row
 *   node scripts/backfill_email_bodies.mjs --dry-run  # report only, no writes
 *
 * On Railway, run it as a one-off command in the service shell.
 * ---------------------------------------------------------------------------
 */

try { await import('dotenv/config'); } catch { /* env already present (e.g. Railway) */ }

import { google } from 'googleapis';
import { query } from '../db/index.js';
import { getAuthedClient } from '../services/gmailService.js';
import { extractBody, hydratePayload } from '../services/gmailSync.js';

const ALL     = process.argv.includes('--all');
const DRY_RUN = process.argv.includes('--dry-run');

// Rows worth re-checking: short bodies are the tell-tale of the old bug.
// Pass --all to re-parse the entire table regardless of current length.
const SELECT = ALL
  ? `SELECT id, gmail_message_id, body_text
       FROM query_emails
      WHERE gmail_message_id IS NOT NULL
      ORDER BY received_at DESC`
  : `SELECT id, gmail_message_id, body_text
       FROM query_emails
      WHERE gmail_message_id IS NOT NULL
        AND length(COALESCE(body_text, '')) < 400
      ORDER BY received_at DESC`;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const auth  = await getAuthedClient();
  if (!auth) { console.error('✗ Gmail not connected — cannot authenticate.'); process.exit(1); }
  const gmail = google.gmail({ version: 'v1', auth });

  const { rows } = await query(SELECT);
  console.log(`Found ${rows.length} email(s) to check${DRY_RUN ? ' (dry run)' : ''}.\n`);

  let updated = 0, unchanged = 0, missing = 0, errors = 0;

  for (const row of rows) {
    try {
      const res     = await gmail.users.messages.get({ userId: 'me', id: row.gmail_message_id, format: 'full' });
      await hydratePayload(gmail, row.gmail_message_id, res.data.payload);
      const fresh   = (extractBody(res.data.payload) || '').trim();
      const current = (row.body_text || '').trim();

      // Only overwrite when we genuinely recovered more content.
      if (fresh && fresh.length > current.length) {
        if (!DRY_RUN) {
          await query(`UPDATE query_emails SET body_text = $1 WHERE id = $2`, [fresh.slice(0, 50000), row.id]);
        }
        updated++;
        console.log(`✔ ${row.id}  ${current.length} → ${fresh.length} chars`);
      } else {
        unchanged++;
      }
    } catch (e) {
      if (e?.code === 404 || e?.response?.status === 404) { missing++; }
      else { errors++; console.warn(`✗ ${row.id}: ${e.message}`); }
    }
    await sleep(120); // stay well under Gmail rate limits
  }

  console.log(`\nDone. updated=${updated} unchanged=${unchanged} missing=${missing} errors=${errors}`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
