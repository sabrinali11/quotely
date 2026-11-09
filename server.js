const path = require("path");
const express = require("express");
const { getQuotes } = require("./lib/rateEngine");
const { STATE_FACTORS } = require("./lib/stateFactors");

const app = express();
const PORT = process.env.PORT || 4321;

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
  res.json(result);
});

app.get("/api/states", (_req, res) => {
  res.json({ states: [...VALID_STATES].sort() });
});

app.listen(PORT, () => {
  console.log(`Quotely demo running at http://localhost:${PORT}`);
});
