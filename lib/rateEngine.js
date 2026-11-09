const { CARRIERS, GENERIC_REGIONAL_FALLBACK } = require("./carriers");
const { getStateFactor, isStateFactorSourced } = require("./stateFactors");
const { getRegionalCarriersForState } = require("./regionalCarriers");

// NerdWallet, Jan 2026: national full-coverage average premium.
const NATIONAL_BASE_ANNUAL = 2339;

const AGE_BANDS = [
  { max: 24, factor: 1.55 },
  { max: 29, factor: 1.20 },
  { max: 45, factor: 1.00 },
  { max: 60, factor: 0.88 },
  { max: 70, factor: 0.95 },
  { max: Infinity, factor: 1.15 },
];

const VEHICLE_TYPE_FACTORS = {
  sedan: 0.95,
  suv: 1.00,
  truck: 1.00,
  minivan: 0.90,
  sports: 1.35,
  luxury: 1.20,
  ev: 1.10,
};

const MILEAGE_FACTORS = {
  low: 0.92,
  medium: 1.00,
  high: 1.10,
  very_high: 1.25,
};

const COVERAGE_FACTORS = {
  liability: 0.45,
  standard: 1.00,
  full_low_deductible: 1.15,
};

const RECORD_FLAT_FACTORS = {
  clean: 1.00,
  not_at_fault_claim: 1.05,
  speeding_ticket: 1.18,
  at_fault_accident: null, // carrier-specific, handled separately
  dui: 2.10,
};

// Bankrate, Feb 2026 (full coverage, annual): poor $4,745 / fair $2,947 / good $2,697 / excellent
// $2,318. Expressed below relative to "good" since that's this model's neutral reference tier.
const CREDIT_TIER_FACTORS = {
  excellent: 0.86,
  good: 1.00,
  fair: 1.09,
  poor: 1.76,
  not_shared: 1.00,
};
const CREDIT_TIER_SOURCE = "Bankrate, Feb 2026";

const MULTI_VEHICLE_FACTORS = { 1: 1.00, 2: 0.93, 3: 0.90, 4: 0.87 };

// CarInsurance.com, 2026: adding a teen driver raises the policy by ~125% on average.
const TEEN_DRIVER_FACTOR = 2.25;
const TEEN_DRIVER_SOURCE = "CarInsurance.com, 2026";

function ageFactor(age) {
  const band = AGE_BANDS.find((b) => age <= b.max);
  return band ? band.factor : 1.0;
}

function multiVehicleFactor(numVehicles) {
  const n = Math.max(1, Math.min(4, Math.round(numVehicles || 1)));
  return MULTI_VEHICLE_FACTORS[n];
}

// Deterministic small per-carrier variance (+/-4%) so repeated quotes for the same
// inputs are stable, while quotes don't move in perfect lockstep across carriers.
function carrierVariance(carrierId, seedString) {
  const str = `${carrierId}:${seedString}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  const normalized = (hash % 1000) / 1000; // 0..1
  return 0.96 + normalized * 0.08; // 0.96..1.04
}

function computeQuote(carrier, input) {
  const factors = [];
  let annual = NATIONAL_BASE_ANNUAL;
  factors.push({
    label: "National baseline (full coverage avg.)",
    amount: annual,
    source: "NerdWallet, Jan 2026",
  });

  const apply = (label, multiplier, source) => {
    annual *= multiplier;
    const factor = { label, multiplier: round2(multiplier), runningAnnual: Math.round(annual) };
    if (source) factor.source = source;
    factors.push(factor);
  };

  apply(`${carrier.name} base pricing`, carrier.baseMultiplier, carrier.baseSource);
  apply("Age", ageFactor(input.age));
  apply("Vehicle type", VEHICLE_TYPE_FACTORS[input.vehicleType] ?? 1.0);
  apply("Annual mileage", MILEAGE_FACTORS[input.annualMileage] ?? 1.0);
  apply("Coverage level", COVERAGE_FACTORS[input.coverageLevel] ?? 1.0);
  apply(
    "State/region risk",
    getStateFactor(input.state),
    isStateFactorSourced(input.state) ? "Bankrate, 2026" : "illustrative regional estimate"
  );
  apply("Credit-based insurance tier", CREDIT_TIER_FACTORS[input.creditTier] ?? 1.0, CREDIT_TIER_SOURCE);
  apply("Vehicles on this policy", multiVehicleFactor(input.numVehicles));

  if (input.maritalStatus === "married") apply("Married discount", 0.95);

  if (input.drivingRecord === "at_fault_accident") {
    apply(
      "At-fault accident surcharge (this carrier)",
      1 + carrier.atFaultAccidentSurcharge,
      carrier.surchargeSource
    );
  } else {
    apply("Driving record", RECORD_FLAT_FACTORS[input.drivingRecord] ?? 1.0);
  }

  if (input.violationsCount > 0) {
    const extra = Math.min(3, input.violationsCount);
    apply(`${extra} additional violation(s)`, Math.pow(1.07, extra));
  }
  if (input.yearsLicensed < 3) apply("Newly licensed driver", 1.15);
  if (input.teenDriverOnPolicy) apply("Teen driver on policy", TEEN_DRIVER_FACTOR, TEEN_DRIVER_SOURCE);
  if (input.hasCoverageLapse) apply("Lapse in coverage", 1.12);
  if (input.homeAutoBundle) apply("Home + auto bundle", 0.92);
  if (input.goodStudentOrDefensiveCourse) apply("Good student / defensive driving course", 0.95);
  if (input.antiTheftDevice) apply("Anti-theft device", 0.97);

  const seed = `${input.state || ""}:${input.age}:${input.drivingRecord}:${input.coverageLevel}:${input.vehicleType}`;
  apply("Carrier-specific underwriting variance", carrierVariance(carrier.id, seed));

  return { annual: Math.round(annual), factors };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function getQuotes(input) {
  // Every state gets all of its named regional candidates plus the generic independent-agent
  // floor, so the regional price shown is the lowest of several real options, not one pick.
  const regionalCarriers = [...getRegionalCarriersForState(input.state), GENERIC_REGIONAL_FALLBACK];
  const allCarriers = [...CARRIERS, ...regionalCarriers];

  const eligibleCarriers = allCarriers.filter((c) => {
    if (c.eligibility === "military") return !!input.militaryHousehold;
    return true;
  });

  const quotes = eligibleCarriers.map((carrier) => {
    const { annual, factors } = computeQuote(carrier, input);
    return {
      carrierId: carrier.id,
      carrierName: carrier.name,
      color: carrier.color,
      regional: !!carrier.regional,
      annualPremium: annual,
      monthlyPremium: Math.round(annual / 12),
      quoteUrl: carrier.quoteUrl,
      note: carrier.note || null,
      factors,
    };
  });

  quotes.sort((a, b) => a.annualPremium - b.annualPremium);

  const best = quotes[0];
  const worst = quotes[quotes.length - 1];
  const estimatedAnnualSavings = worst ? worst.annualPremium - best.annualPremium : 0;

  let personalized = null;
  if (input.currentAnnualPremium && best) {
    const savings = input.currentAnnualPremium - best.annualPremium;
    personalized = {
      currentAnnualPremium: input.currentAnnualPremium,
      bestAnnualPremium: best.annualPremium,
      annualSavings: savings,
      percentSavings: Math.round((savings / input.currentAnnualPremium) * 100),
    };
  }

  return {
    quotes,
    summary: {
      bestAnnual: best ? best.annualPremium : null,
      worstAnnual: worst ? worst.annualPremium : null,
      estimatedAnnualSavings,
      personalized,
    },
  };
}

module.exports = { getQuotes, NATIONAL_BASE_ANNUAL };
