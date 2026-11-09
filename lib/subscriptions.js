// Store for "keep watching this quote" subscriptions, backed by local SQLite (lib/db.js).
const crypto = require("crypto");
const { getDb } = require("./db");

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function intervalFor(frequency) {
  return frequency === "weekly" ? WEEK_MS : MONTH_MS;
}

function rowToSubscription(row) {
  return {
    id: row.id,
    phoneNumber: row.phone_number,
    frequency: row.frequency,
    quoteInput: JSON.parse(row.quote_input),
    bestAnnualPremium: row.best_annual_premium,
    bestCarrierName: row.best_carrier_name,
    status: row.status,
    createdAt: row.created_at,
    lastCheckedAt: row.last_checked_at,
    checksRun: row.checks_run,
  };
}

function migrate() {
  getDb(); // opens the file and ensures the table exists
}

function createSubscription({ phoneNumber, frequency, quoteInput, bestAnnualPremium, bestCarrierName }) {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  getDb()
    .prepare(
      `INSERT INTO subscriptions
        (id, phone_number, frequency, quote_input, best_annual_premium, best_carrier_name, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`
    )
    .run(id, phoneNumber, frequency, JSON.stringify(quoteInput), bestAnnualPremium, bestCarrierName, createdAt);

  return {
    id,
    phoneNumber,
    frequency,
    quoteInput,
    bestAnnualPremium,
    bestCarrierName,
    status: "active",
    createdAt,
    lastCheckedAt: null,
    checksRun: 0,
  };
}

function getSubscription(id) {
  const row = getDb().prepare("SELECT * FROM subscriptions WHERE id = ?").get(id);
  return row ? rowToSubscription(row) : null;
}

function cancelSubscription(id) {
  const result = getDb()
    .prepare("UPDATE subscriptions SET status = 'cancelled' WHERE id = ? AND status = 'active'")
    .run(id);
  return result.changes > 0;
}

function getDueSubscriptions(now = Date.now()) {
  const rows = getDb().prepare("SELECT * FROM subscriptions WHERE status = 'active'").all();
  return rows
    .map(rowToSubscription)
    .filter((sub) => now - new Date(sub.lastCheckedAt || sub.createdAt).getTime() >= intervalFor(sub.frequency));
}

function recordCheck(id, { checkedAt, bestAnnualPremium, bestCarrierName }) {
  getDb()
    .prepare(
      `UPDATE subscriptions
       SET last_checked_at = ?, best_annual_premium = ?, best_carrier_name = ?, checks_run = checks_run + 1
       WHERE id = ?`
    )
    .run(checkedAt, bestAnnualPremium, bestCarrierName, id);
}

module.exports = {
  migrate,
  createSubscription,
  getSubscription,
  cancelSubscription,
  getDueSubscriptions,
  recordCheck,
};
