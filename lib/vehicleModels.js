// Real, published per-model insurance cost data for specific popular makes/models (2026).
// Multipliers are each model's published annual full-coverage average ÷ the $2,339/yr
// NerdWallet national baseline used elsewhere in the rate engine, so they compose with the
// rest of the model the same way every other sourced factor does. Only a modest set of widely
// -cited models are included — this is illustrative of how much make/model matters, not a
// complete vehicle database. Unmatched vehicles fall back to the existing body-style factor
// (sedan/suv/truck/etc.) in rateEngine.js, same as before this feature existed.
const MAKE_ALIASES = { vw: "volkswagen", chevy: "chevrolet" };

function normalize(make, model) {
  const m = (make || "").toLowerCase().trim();
  const resolvedMake = MAKE_ALIASES[m] || m;
  return (resolvedMake + " " + (model || "").toLowerCase().trim())
    .replace(/[^a-z0-9]+/g, "");
}

const VEHICLE_MODEL_FACTORS = {
  [normalize("Honda", "CR-V")]: { multiplier: 0.83, source: "Insurance.com, 2026" },
  [normalize("Honda", "HR-V")]: { multiplier: 0.83, source: "Insurance.com, 2026" },
  [normalize("Volkswagen", "Tiguan")]: { multiplier: 0.85, source: "Insurance.com, 2026" },
  [normalize("Subaru", "Legacy")]: { multiplier: 0.92, source: "Insurance.com, 2026" },
  [normalize("Ford", "Maverick")]: { multiplier: 0.91, source: "Insurance.com, 2026" },
  [normalize("Subaru", "Crosstrek")]: { multiplier: 0.98, source: "published 2026 ranking" },
  [normalize("Jeep", "Wrangler")]: { multiplier: 0.99, source: "published 2026 ranking" },
  [normalize("Ram", "1500 TRX")]: { multiplier: 1.39, source: "Insurance.com, 2026 (most expensive truck)" },
  [normalize("Jeep", "Grand Wagoneer")]: { multiplier: 1.60, source: "Insurance.com, 2026 (most expensive SUV)" },
  [normalize("BMW", "M5")]: { multiplier: 2.82, source: "CarInsurance.com, 2026" },
  [normalize("BMW", "M8 Gran Coupe")]: { multiplier: 2.88, source: "CarInsurance.com, 2026" },
  [normalize("Maserati", "Ghibli")]: { multiplier: 2.73, source: "CarInsurance.com, 2026" },
  [normalize("Maserati", "Quattroporte")]: { multiplier: 3.03, source: "CarInsurance.com, 2026" },
};

function getVehicleModelFactor(make, model) {
  if (!make && !model) return null;
  return VEHICLE_MODEL_FACTORS[normalize(make, model)] || null;
}

module.exports = { getVehicleModelFactor };
