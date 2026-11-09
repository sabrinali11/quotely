// MOCK SMS sender — no real carrier/Twilio integration exists yet (see CLAUDE.md). Logs what
// would have been texted so the recurring-monitor flow is demoable end-to-end before a real SMS
// provider and credentials are wired in.
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const LOG_FILE = path.join(DATA_DIR, "sms-log.json");

function maskPhone(phone) {
  const digits = String(phone).replace(/\D/g, "");
  return digits.length >= 4 ? `***-***-${digits.slice(-4)}` : "***";
}

function appendLog(entry) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const existing = fs.existsSync(LOG_FILE) ? JSON.parse(fs.readFileSync(LOG_FILE, "utf8")) : [];
    existing.push(entry);
    fs.writeFileSync(LOG_FILE, JSON.stringify(existing.slice(-200), null, 2));
  } catch (err) {
    // best-effort only — logging must never break the monitor cycle
  }
}

function sendSms({ to, body }) {
  const entry = { to: maskPhone(to), body, sentAt: new Date().toISOString(), mock: true };
  console.log(`[MOCK SMS] to ${entry.to}: ${body}`);
  appendLog(entry);
  return entry;
}

module.exports = { sendSms };
