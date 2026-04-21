/**
 * Moov OS — Auto migration runner
 * Runs on server startup. Executes any pending .sql files in /db/migrations/
 * in alphabetical order and tracks them in a _migrations table.
 */

import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { query } from './index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runMigrations() {
  console.log('🔄 Checking database migrations…');

  // Ensure tracking table exists
  await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename  VARCHAR(255) PRIMARY KEY,
      run_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Read migration files in alphabetical order
  const migrationsDir = join(__dirname, 'migrations');
  const files = (await readdir(migrationsDir))
    .filter(f => f.endsWith('.sql'))
    .sort();

  // Find which have already been run
  const { rows } = await query('SELECT filename FROM _migrations');
  const completed = new Set(rows.map(r => r.filename));

  let ran = 0;
  for (const file of files) {
    if (completed.has(file)) continue;

    console.log(`  ↳ Running migration: ${file}`);
    const sql = await readFile(join(migrationsDir, file), 'utf8');

    try {
      await query(sql);
      await query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
      console.log(`  ✓ ${file}`);
      ran++;
    } catch (err) {
      console.error(`  ✖ Migration failed: ${file}`, err.message);
      throw err; // halt startup — do not run a broken database
    }
  }

  if (ran === 0) {
    console.log('  ✓ All migrations already applied');
  } else {
    console.log(`  ✓ Applied ${ran} migration(s)`);
  }
}
