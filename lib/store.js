// Lightweight local tracking for quote completions and tester feedback.
// Stored as a JSON file on local disk — fine for a quick demo/testing session, but NOT
// durable: Render's free tier doesn't guarantee the filesystem survives a spin-down/restart.
// Do a testing session in one sitting and check /stats.html right after, rather than relying
// on this to persist over days.
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "stats.json");
const VALID_REACTIONS = new Set(["meh", "interested", "hell_yes"]);

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (err) {
    return { quotesCompleted: 0, feedback: [] };
  }
}

function save(data) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    // best-effort only — tracking must never break the actual app
  }
}

function recordQuoteCompletion() {
  const data = load();
  data.quotesCompleted = (data.quotesCompleted || 0) + 1;
  save(data);
}

function recordFeedback({ reaction, comment }) {
  if (!VALID_REACTIONS.has(reaction)) return false;
  const data = load();
  data.feedback = data.feedback || [];
  data.feedback.push({
    reaction,
    comment: typeof comment === "string" ? comment.slice(0, 500) : "",
    ts: new Date().toISOString(),
  });
  if (data.feedback.length > 200) data.feedback = data.feedback.slice(-200);
  save(data);
  return true;
}

function getStats() {
  const data = load();
  const feedback = data.feedback || [];
  const feedbackCounts = { meh: 0, interested: 0, hell_yes: 0 };
  feedback.forEach((f) => {
    if (feedbackCounts[f.reaction] !== undefined) feedbackCounts[f.reaction]++;
  });
  return {
    quotesCompleted: data.quotesCompleted || 0,
    totalFeedback: feedback.length,
    feedbackCounts,
    recentFeedback: feedback.slice(-30).reverse(),
  };
}

module.exports = { recordQuoteCompletion, recordFeedback, getStats };
