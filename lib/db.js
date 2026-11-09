// Postgres connection for the quote-monitoring feature (subscriptions table only — the rate
// engine itself stays stateless/in-memory). Set DATABASE_URL (a free-tier Neon/Supabase project
// works fine) to enable it; without it, lib/subscriptions.js falls back to an in-memory store.
let pool = null;

const usingPostgres = !!process.env.DATABASE_URL;

function getPool() {
  if (!usingPostgres) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!pool) {
    const { Pool } = require("pg");
    const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function migrate() {
  if (!usingPostgres) return;
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id UUID PRIMARY KEY,
      phone_number TEXT NOT NULL,
      frequency TEXT NOT NULL,
      quote_input JSONB NOT NULL,
      best_annual_premium NUMERIC NOT NULL,
      best_carrier_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_checked_at TIMESTAMPTZ,
      checks_run INTEGER NOT NULL DEFAULT 0
    );
  `);
}

module.exports = { getPool, usingPostgres, migrate };
