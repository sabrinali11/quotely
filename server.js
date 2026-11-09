const path = require("path");
const cron = require("node-cron");
const express = require("express");
const { getQuotes } = require("./lib/rateEngine");
const { STATE_FACTORS } = require("./lib/stateFactors");
const store = require("./lib/store");
const subscriptions = require("./lib/subscriptions");
const monitor = require("./lib/monitor");

const app = express();
const PORT = process.env.PORT || 4321;
const FREQUENCIES = new Set(["weekly", "monthly"]);
const PHONE_DIGITS_RE = /^1?\d{10}$/;

function normalizePhone(raw) {
  return String(raw || "").trim().replace(/[^\d]/g, "");
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const DRIVING_RECORDS = new Set([
  "clean",
  "not_at_fault_claim",
  "speeding_ticket",
  "at_fault_accident",
  "dui",
]);
const VEHICLE_TYPES = new Set(["sedan", "suv", "truck", "minivan", "sports", "luxury", "ev"]);
const MILEAGE_BANDS = new Set(["low", "medium", "high", "very_high"]);
const COVERAGE_LEVELS = new Set(["liability", "standard", "full_low_deductible"]);
const VALID_STATES = new Set(Object.keys(STATE_FACTORS));
const CREDIT_TIERS = new Set(["excellent", "good", "fair", "poor", "not_shared"]);
const OWNERSHIP_STATUSES = new Set(["own", "financing", "leasing"]);
const PRIMARY_USES = new Set(["pleasure", "commute", "business"]);
const CURRENT_YEAR = new Date().getFullYear();

function validateInput(body) {
  const errors = [];
  const age = Number(body.age);
  if (!Number.isFinite(age) || age < 16 || age > 100) {
    errors.push("age must be a number between 16 and 100");
  }

  const state = String(body.state || "").toUpperCase();
  if (!VALID_STATES.has(state)) {
    errors.push("state must be a valid two-letter US state/DC code");
  }

  const drivingRecord = body.drivingRecord;
  if (!DRIVING_RECORDS.has(drivingRecord)) {
    errors.push(`drivingRecord must be one of: ${[...DRIVING_RECORDS].join(", ")}`);
  }

  const vehicleType = body.vehicleType;
  if (!VEHICLE_TYPES.has(vehicleType)) {
    errors.push(`vehicleType must be one of: ${[...VEHICLE_TYPES].join(", ")}`);
  }

  const annualMileage = body.annualMileage;
  if (!MILEAGE_BANDS.has(annualMileage)) {
    errors.push(`annualMileage must be one of: ${[...MILEAGE_BANDS].join(", ")}`);
  }

  const coverageLevel = body.coverageLevel;
  if (!COVERAGE_LEVELS.has(coverageLevel)) {
    errors.push(`coverageLevel must be one of: ${[...COVERAGE_LEVELS].join(", ")}`);
  }

  const creditTier = body.creditTier;
  if (!CREDIT_TIERS.has(creditTier)) {
    errors.push(`creditTier must be one of: ${[...CREDIT_TIERS].join(", ")}`);
  }

  const yearsLicensed = Number(body.yearsLicensed);
  if (!Number.isFinite(yearsLicensed) || yearsLicensed < 0 || yearsLicensed > 80) {
    errors.push("yearsLicensed must be a number between 0 and 80");
  }

  const numVehicles = Number(body.numVehicles);
  if (!Number.isFinite(numVehicles) || numVehicles < 1 || numVehicles > 10) {
    errors.push("numVehicles must be a number between 1 and 10");
  }

  const violationsCount = Number(body.violationsCount ?? 0);
  if (!Number.isFinite(violationsCount) || violationsCount < 0 || violationsCount > 10) {
    errors.push("violationsCount must be a number between 0 and 10");
  }

  const ownershipStatus = body.ownershipStatus || "own";
  if (!OWNERSHIP_STATUSES.has(ownershipStatus)) {
    errors.push(`ownershipStatus must be one of: ${[...OWNERSHIP_STATUSES].join(", ")}`);
  }

  const primaryUse = body.primaryUse || "pleasure";
  if (!PRIMARY_USES.has(primaryUse)) {
    errors.push(`primaryUse must be one of: ${[...PRIMARY_USES].join(", ")}`);
  }

  let vehicleYear = null;
  if (body.vehicleYear !== undefined && body.vehicleYear !== null && body.vehicleYear !== "") {
    vehicleYear = Number(body.vehicleYear);
    if (!Number.isFinite(vehicleYear) || vehicleYear < 1980 || vehicleYear > CURRENT_YEAR + 1) {
      errors.push(`vehicleYear must be a number between 1980 and ${CURRENT_YEAR + 1}`);
    }
  }

  const vehicleMake = typeof body.vehicleMake === "string" ? body.vehicleMake.trim().slice(0, 40) : "";
  const vehicleModel = typeof body.vehicleModel === "string" ? body.vehicleModel.trim().slice(0, 40) : "";

  let currentAnnualPremium = null;
  if (body.currentMonthlyPremium !== undefined && body.currentMonthlyPremium !== null && body.currentMonthlyPremium !== "") {
    const monthly = Number(body.currentMonthlyPremium);
    if (!Number.isFinite(monthly) || monthly < 0 || monthly > 5000) {
      errors.push("currentMonthlyPremium must be a number between 0 and 5000");
    } else {
      currentAnnualPremium = Math.round(monthly * 12);
    }
  }

  return {
    errors,
    clean: {
      age,
      state,
      drivingRecord,
      vehicleType,
      annualMileage,
      coverageLevel,
      creditTier,
      yearsLicensed,
      numVehicles,
      violationsCount,
      currentAnnualPremium,
      ownershipStatus,
      primaryUse,
      vehicleYear,
      vehicleMake,
      vehicleModel,
      maritalStatus: body.maritalStatus === "married" ? "married" : "single",
      teenDriverOnPolicy: !!body.teenDriverOnPolicy,
      hasCoverageLapse: !!body.hasCoverageLapse,
      militaryHousehold: !!body.militaryHousehold,
      homeAutoBundle: !!body.homeAutoBundle,
      goodStudentOrDefensiveCourse: !!body.goodStudentOrDefensiveCourse,
      antiTheftDevice: !!body.antiTheftDevice,
    },
  };
}

app.post("/api/quote", (req, res) => {
  const { errors, clean } = validateInput(req.body || {});
  if (errors.length) {
    return res.status(400).json({ error: "invalid_input", details: errors });
  }
  const result = getQuotes(clean);
  store.recordQuoteCompletion();
  res.json(result);
});

app.get("/api/states", (_req, res) => {
  res.json({ states: [...VALID_STATES].sort() });
});

app.post("/api/feedback", (req, res) => {
  const { reaction, comment } = req.body || {};
  const ok = store.recordFeedback({ reaction, comment });
  if (!ok) {
    return res.status(400).json({ error: "invalid_reaction" });
  }
  res.json({ ok: true });
});

app.get("/api/stats", (_req, res) => {
  res.json(store.getStats());
});

// Recurring quote-monitoring ("keep watching this quote for me"). SMS is mocked (see
// lib/sms.js) — no real texts are sent yet.
app.post("/api/subscribe", async (req, res) => {
  const { errors, clean } = validateInput(req.body || {});
  if (errors.length) {
    return res.status(400).json({ error: "invalid_input", details: errors });
  }

  const phoneDigits = normalizePhone(req.body.phoneNumber);
  if (!PHONE_DIGITS_RE.test(phoneDigits)) {
    return res.status(400).json({ error: "invalid_phone", details: ["phoneNumber must be a valid 10-digit US phone number"] });
  }

  const frequency = req.body.frequency;
  if (!FREQUENCIES.has(frequency)) {
    return res.status(400).json({ error: "invalid_frequency", details: [`frequency must be one of: ${[...FREQUENCIES].join(", ")}`] });
  }

  if (req.body.consent !== true) {
    return res.status(400).json({ error: "consent_required", details: ["consent to be texted is required"] });
  }

  const { quotes } = getQuotes(clean);
  const best = quotes[0];
  const phoneNumber = `+1${phoneDigits.slice(-10)}`;

  try {
    const sub = await subscriptions.createSubscription({
      phoneNumber,
      frequency,
      quoteInput: clean,
      bestAnnualPremium: best.annualPremium,
      bestCarrierName: best.carrierName,
    });
    res.json({
      id: sub.id,
      status: sub.status,
      frequency: sub.frequency,
      bestAnnualPremium: sub.bestAnnualPremium,
      bestCarrierName: sub.bestCarrierName,
      createdAt: sub.createdAt,
      lastCheckedAt: sub.lastCheckedAt,
    });
  } catch (err) {
    console.error("subscribe failed:", err);
    res.status(503).json({ error: "monitoring_unavailable" });
  }
});

app.get("/api/subscriptions/:id", async (req, res) => {
  try {
    const sub = await subscriptions.getSubscription(req.params.id);
    if (!sub) return res.status(404).json({ error: "not_found" });
    res.json({
      id: sub.id,
      status: sub.status,
      frequency: sub.frequency,
      bestAnnualPremium: sub.bestAnnualPremium,
      bestCarrierName: sub.bestCarrierName,
      createdAt: sub.createdAt,
      lastCheckedAt: sub.lastCheckedAt,
      checksRun: sub.checksRun,
    });
  } catch (err) {
    console.error("get subscription failed:", err);
    res.status(503).json({ error: "monitoring_unavailable" });
  }
});

app.post("/api/subscriptions/:id/cancel", async (req, res) => {
  try {
    const ok = await subscriptions.cancelSubscription(req.params.id);
    if (!ok) return res.status(404).json({ error: "not_found" });
    res.json({ ok: true });
  } catch (err) {
    console.error("cancel subscription failed:", err);
    res.status(503).json({ error: "monitoring_unavailable" });
  }
});

// Demo/testing helper: fires a monitor cycle immediately instead of waiting for the cron
// schedule (useful since in-process cron doesn't reliably fire on Render's free tier once the
// app has spun down — see CLAUDE.md).
app.post("/api/monitor/run-now", async (_req, res) => {
  try {
    const results = await monitor.runCheckCycle();
    res.json({ checked: results.length, results });
  } catch (err) {
    console.error("manual monitor run failed:", err);
    res.status(503).json({ error: "monitoring_unavailable" });
  }
});

try {
  subscriptions.migrate();
  console.log("Quote-monitoring subscriptions stored in data/subscriptions.db");
} catch (err) {
  console.error("subscriptions database init failed:", err);
}

cron.schedule(process.env.CRON_SCHEDULE || "0 9 * * *", () => {
  monitor.runCheckCycle().catch((err) => console.error("scheduled monitor run failed:", err));
});

app.listen(PORT, () => {
  console.log(`Quotely demo running at http://localhost:${PORT}`);
});
