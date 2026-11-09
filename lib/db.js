// Local SQLite database for quote-monitoring subscriptions. No external account or service —
// the file lives at data/subscriptions.db (gitignored, alongside data/stats.json). Locally this
// is fully durable across restarts. On Render's free tier it inherits the same caveat as
// lib/store.js: the filesystem isn't guaranteed to survive a spin-down/restart (see CLAUDE.md).
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "subscriptions.db");

let db = null;

function getDb() {
  if (!db) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    db = new DatabaseSync(DB_FILE);
    db.exec(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        phone_number TEXT NOT NULL,
        frequency TEXT NOT NULL,
        quote_input TEXT NOT NULL,
        best_annual_premium REAL NOT NULL,
        best_carrier_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        last_checked_at TEXT,
        checks_run INTEGER NOT NULL DEFAULT 0
      );
    `);
  }
  return db;
}

module.exports = { getDb };
