// Carrier rate profiles for the Quotely demo, grounded in published 2026 rate data.
// baseMultiplier: this carrier's own published full-coverage average ÷ the $2,339/yr NerdWallet
// (Jan 2026) national full-coverage average used as NATIONAL_BASE_ANNUAL in rateEngine.js.
// Public rate data is genuinely inconsistent across sources (every site surveys a different driver
// profile) — that fragmentation is real, not a shortcut on our part, and it's exactly why a real
// aggregator needs a licensed carrier/rating-vendor feed instead of public rate articles. Where we
// found a specific, named source for a carrier, baseSource/surchargeSource says so; where we didn't,
// it falls back to the MoneyGeek national average (48.8%) rather than inventing a precise number.
const CARRIERS = [
  {
    id: "geico",
    name: "GEICO",
    color: "#005A2B",
    baseMultiplier: 0.96, // $187/mo = $2,244/yr
    baseSource: "ValuePenguin, 2026",
    atFaultAccidentSurcharge: 0.569,
    surchargeSource: "MoneyGeek",
    quoteUrl: "https://www.geico.com/auto-insurance/",
    eligibility: null,
  },
  {
    id: "state_farm",
    name: "State Farm",
    color: "#D1262C",
    baseMultiplier: 0.99, // $192/mo = $2,304/yr
    baseSource: "ValuePenguin, 2026",
    atFaultAccidentSurcharge: 0.243,
    surchargeSource: "MoneyGeek",
    quoteUrl: "https://www.statefarm.com/insurance/auto",
    eligibility: null,
  },
  {
    id: "progressive",
    name: "Progressive",
    color: "#0058A3",
    baseMultiplier: 0.89, // $2,057/yr vs NerdWallet's own $2,315/yr national avg
    baseSource: "NerdWallet, Apr 2026",
    atFaultAccidentSurcharge: 0.488,
    surchargeSource: "MoneyGeek national average (no Progressive-specific figure found)",
    quoteUrl: "https://www.progressive.com/auto/",
    eligibility: null,
  },
  {
    id: "liberty_mutual",
    name: "Liberty Mutual",
    color: "#FFC72C",
    baseMultiplier: 1.22, // ~$2,861/yr — lower-confidence single source
    baseSource: "autoinsurance.com (lower confidence — not cross-checked elsewhere)",
    atFaultAccidentSurcharge: 0.488,
    surchargeSource: "MoneyGeek national average (no Liberty Mutual-specific figure found)",
    quoteUrl: "https://www.libertymutual.com/auto-insurance",
    eligibility: null,
  },
  {
    id: "allstate",
    name: "Allstate",
    color: "#0033A0",
    baseMultiplier: 1.07, // $2,513/yr pre-accident baseline
    baseSource: "insurance.com, 2026",
    atFaultAccidentSurcharge: 0.488,
    surchargeSource: "MoneyGeek national average (sources conflict 60-66% for Allstate specifically)",
    quoteUrl: "https://www.allstate.com/auto-insurance",
    eligibility: null,
  },
  {
    id: "nationwide",
    name: "Nationwide",
    color: "#1C2B5A",
    baseMultiplier: 0.85, // ~$1,987/yr — lower-confidence single source
    baseSource: "autoinsurance.com (lower confidence — not cross-checked elsewhere)",
    atFaultAccidentSurcharge: 0.488,
    surchargeSource: "MoneyGeek national average (no Nationwide-specific figure found)",
    quoteUrl: "https://www.nationwide.com/personal/insurance/auto/",
    eligibility: null,
  },
  {
    id: "usaa",
    name: "USAA",
    color: "#002F6C",
    baseMultiplier: 0.64, // $125/mo = $1,500/yr, full coverage
    baseSource: "LendingTree, 2026",
    atFaultAccidentSurcharge: 0.488,
    surchargeSource: "MoneyGeek national average (no USAA-specific figure found)",
    quoteUrl: "https://www.usaa.com/inet/wc/insurance-auto",
    eligibility: "military",
  },
];

// Shown only for states without a mapped regional carrier (see regionalCarriers.js).
const GENERIC_REGIONAL_FALLBACK = {
  id: "local_independent",
  name: "Local independent agents",
  color: "#7A5C00",
  baseMultiplier: 0.88,
  baseSource: "illustrative — no public per-agency data available",
  atFaultAccidentSurcharge: 0.30,
  surchargeSource: "illustrative — no public per-agency data available",
  quoteUrl: "https://www.trustedchoice.com/car-insurance/",
  eligibility: null,
  note: "We don't have a confident regional-carrier pick for your state yet — this represents smaller carriers typically sold through independent agents in your area.",
};

module.exports = { CARRIERS, GENERIC_REGIONAL_FALLBACK };
