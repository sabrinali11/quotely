// Relative cost-of-insurance index by state for the Quotely demo, as (state avg ÷ national avg).
// A handful of states have a real sourced figure (Bankrate, Feb/Apr 2026, full coverage); the rest
// are illustrative — based on general, widely-reported regional patterns (litigation/claim costs,
// uninsured-driver rates, weather/theft exposure), not individually sourced per-state filed rates.
// We could not retrieve a complete 50-state table from one consistent source in the time we spent
// looking (Bankrate's state page renders its table client-side, so it isn't readable by a fetch).
const STATE_FACTORS = {
  AL: 0.80, AK: 0.88, AZ: 1.03, AR: 1.04, CA: 1.10, CO: 1.05, CT: 1.08, DE: 1.18,
  FL: 1.44, GA: 1.08, HI: 0.75, ID: 0.75, IL: 1.00, IN: 0.88, IA: 0.78, KS: 0.92,
  KY: 1.12, LA: 1.53, ME: 0.75, MD: 1.12, MA: 1.00, MI: 1.30, MN: 0.90, MS: 1.08,
  MO: 0.98, MT: 0.90, NE: 0.88, NV: 1.20, NH: 0.75, NJ: 1.18, NM: 1.05, NY: 1.22,
  NC: 0.90, ND: 0.80, OH: 0.80, OK: 1.05, OR: 0.95, PA: 0.95, RI: 1.30, SC: 1.08,
  SD: 0.82, TN: 0.95, TX: 1.08, UT: 0.92, VT: 0.75, VA: 0.88, WA: 0.95, WV: 0.95,
  WI: 0.78, WY: 0.90, DC: 1.25,
};

// States with a real, Bankrate-sourced figure behind their factor above (everything else is
// illustrative — see header comment). HI/ID/ME/NH/VT are named by Bankrate as the five cheapest
// states but without published dollar figures, so their 0.75 is an estimate consistent with that
// ranking, not an exact sourced ratio like AL/AK/FL/GA/LA.
const STATE_FACTOR_SOURCED = new Set(["AL", "AK", "FL", "GA", "LA"]);

const DEFAULT_STATE_FACTOR = 1.0;

function getStateFactor(stateCode) {
  if (!stateCode) return DEFAULT_STATE_FACTOR;
  return STATE_FACTORS[stateCode.toUpperCase()] || DEFAULT_STATE_FACTOR;
}

function isStateFactorSourced(stateCode) {
  return STATE_FACTOR_SOURCED.has((stateCode || "").toUpperCase());
}

module.exports = { STATE_FACTORS, getStateFactor, isStateFactorSourced };
