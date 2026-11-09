// Store for "keep watching this quote" subscriptions. Uses Postgres when DATABASE_URL is set;
// otherwise falls back to an in-memory Map so the feature is still demoable locally without a
// database — subscriptions in that mode don't survive a server restart.
const crypto = require("crypto");
const { getPool, usingPostgres, migrate } = require("./db");

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

const memoryStore = new Map();

function intervalFor(frequency) {
  return frequency === "weekly" ? WEEK_MS : MONTH_MS;
}

function rowToSubscription(row) {
  return {
    id: row.id,
    phoneNumber: row.phone_number,
    frequency: row.frequency,
    quoteInput: row.quote_input,
    bestAnnualPremium: Number(row.best_annual_premium),
    bestCarrierName: row.best_carrier_name,
    status: row.status,
    createdAt: row.created_at,
    lastCheckedAt: row.last_checked_at,
    checksRun: row.checks_run,
  };
}

async function createSubscription({ phoneNumber, frequency, quoteInput, bestAnnualPremium, bestCarrierName }) {
  const sub = {
    id: crypto.randomUUID(),
    phoneNumber,
    frequency,
    quoteInput,
    bestAnnualPremium,
    bestCarrierName,
    status: "active",
    createdAt: new Date().toISOString(),
    lastCheckedAt: null,
    checksRun: 0,
  };

  if (!usingPostgres) {
    memoryStore.set(sub.id, sub);
    return sub;
  }

  await getPool().query(
    `INSERT INTO subscriptions
      (id, phone_number, frequency, quote_input, best_annual_premium, best_carrier_name, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'active', now())`,
    [sub.id, phoneNumber, frequency, JSON.stringify(quoteInput), bestAnnualPremium, bestCarrierName]
  );
  return sub;
}

async function getSubscription(id) {
  if (!usingPostgres) {
    return memoryStore.get(id) || null;
  }
  const { rows } = await getPool().query("SELECT * FROM subscriptions WHERE id = $1", [id]);
  return rows[0] ? rowToSubscription(rows[0]) : null;
}

async function cancelSubscription(id) {
  if (!usingPostgres) {
    const sub = memoryStore.get(id);
    if (!sub) return false;
    sub.status = "cancelled";
    return true;
  }
  const { rowCount } = await getPool().query(
    "UPDATE subscriptions SET status = 'cancelled' WHERE id = $1 AND status = 'active'",
    [id]
  );
  return rowCount > 0;
}

async function getDueSubscriptions(now = Date.now()) {
  const isDue = (sub) => {
    const last = sub.lastCheckedAt || sub.createdAt;
    return now - new Date(last).getTime() >= intervalFor(sub.frequency);
  };

  if (!usingPostgres) {
    return [...memoryStore.values()].filter((sub) => sub.status === "active" && isDue(sub));
  }

  const { rows } = await getPool().query("SELECT * FROM subscriptions WHERE status = 'active'");
  return rows.map(rowToSubscription).filter(isDue);
}

async function recordCheck(id, { checkedAt, bestAnnualPremium, bestCarrierName }) {
  if (!usingPostgres) {
    const sub = memoryStore.get(id);
    if (!sub) return;
    sub.lastCheckedAt = checkedAt;
    sub.bestAnnualPremium = bestAnnualPremium;
    sub.bestCarrierName = bestCarrierName;
    sub.checksRun += 1;
    return;
  }
  await getPool().query(
    `UPDATE subscriptions
     SET last_checked_at = $2, best_annual_premium = $3, best_carrier_name = $4, checks_run = checks_run + 1
     WHERE id = $1`,
    [id, checkedAt, bestAnnualPremium, bestCarrierName]
  );
}

module.exports = {
  migrate,
  createSubscription,
  getSubscription,
  cancelSubscription,
  getDueSubscriptions,
  recordCheck,
};
