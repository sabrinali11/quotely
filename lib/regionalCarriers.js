// Real regional/state-domiciled auto insurers that often underprice the national carriers
// inside their home footprint. Rate factors here are illustrative (no public per-carrier data
// exists for most of these — they don't publish rate tables the way national carriers do),
// but the COMPANIES and the states they're known to write business in are real. We list
// multiple regional candidates per state (where we have confident real picks) instead of one,
// so the "regional" quote reflects the lowest of several real options, not a single arbitrary
// pick — always confirm current availability directly with the carrier.
//
// Every state also always gets the generic independent-agent floor from carriers.js
// (GENERIC_REGIONAL_FALLBACK), added separately in rateEngine.js, as one more candidate.

// Reusable illustrative rate profiles, one per real company (kept distinct per company so
// multiple regional carriers in the same state actually spread out instead of clustering).
const ERIE = () => regional("Erie Insurance", "#0056A4", "https://www.erieinsurance.com/auto-insurance", 0.82, 0.26);
const MERCURY = () => regional("Mercury Insurance", "#C8102E", "https://www.mercuryinsurance.com/auto-insurance.html", 0.87, 0.33);
const NJM = () => regional("NJM Insurance Group", "#00558C", "https://www.njm.com/insurance/auto", 0.80, 0.24);
const AMICA = () => regional("Amica Mutual", "#003DA5", "https://www.amica.com/en/auto-insurance.html", 0.85, 0.30);
const SHELTER = () => regional("Shelter Insurance", "#8B1E3F", "https://www.shelterinsurance.com/insurance/auto", 0.86, 0.31);
const COUNTRY_FINANCIAL = () => regional("COUNTRY Financial", "#00843D", "https://www.countryfinancial.com/en/insurance/auto.html", 0.88, 0.34);
const PEMCO = () => regional("PEMCO Insurance", "#004B8D", "https://www.pemco.com/insurance/auto", 0.81, 0.27);
const GRANGE = () => regional("Grange Insurance", "#D4A017", "https://www.grangeinsurance.com/personal/auto", 0.89, 0.35);
const COMMERCE = () => regional("Commerce Insurance", "#6A1B9A", "https://www.commerceinsurance.com/", 0.84, 0.29);
const FBFS = () => regional("Farm Bureau Financial Services", "#2E7D32", "https://www.fbfs.com/products/auto-insurance", 0.85, 0.30);
const AUTO_OWNERS = () => regional("Auto-Owners Insurance", "#B8860B", "https://www.auto-owners.com/insurance/auto", 0.83, 0.28);

// Real, separately-chartered state Farm Bureau insurance affiliates (this structure — one
// per state, each its own company — is genuinely how Farm Bureau Insurance works nationally).
// Shared illustrative profile across all of them; domains are our best-confidence guess per
// state and may not be exact — treat as "search '[state] Farm Bureau Insurance'" if broken.
function stateFarmBureau(name, url, lowConfidence) {
  const c = regional(name, "#6B8E23", url, 0.86, 0.31);
  if (lowConfidence) c.note = "Lower confidence: we're not fully certain this is the carrier's current domain — search the company name directly if the link doesn't resolve.";
  return c;
}

const REGIONAL_CARRIERS = {
  AL: [stateFarmBureau("Alfa Insurance", "https://www.alfainsurance.com"), AUTO_OWNERS()],
  AK: [],
  AZ: [FBFS()],
  AR: [stateFarmBureau("Arkansas Farm Bureau Insurance", "https://www.arfb.com/insurance")],
  CA: [MERCURY()],
  CO: [],
  CT: [ERIE()],
  DE: [],
  FL: [stateFarmBureau("Florida Farm Bureau Insurance", "https://www.floridafarmbureau.com", true), AUTO_OWNERS()],
  GA: [stateFarmBureau("Georgia Farm Bureau Insurance", "https://www.gfb.com"), AUTO_OWNERS()],
  HI: [],
  ID: [FBFS()],
  IL: [COUNTRY_FINANCIAL(), AUTO_OWNERS()],
  IN: [ERIE(), stateFarmBureau("Indiana Farm Bureau Insurance", "https://www.infarmbureau.com", true), AUTO_OWNERS()],
  IA: [FBFS(), AUTO_OWNERS()],
  KS: [FBFS()],
  KY: [ERIE(), stateFarmBureau("Kentucky Farm Bureau Insurance", "https://www.kyfb.com"), AUTO_OWNERS()],
  LA: [stateFarmBureau("Louisiana Farm Bureau Insurance", "https://www.lfbi.com", true)],
  ME: [],
  MD: [ERIE()],
  MA: [COMMERCE()],
  MI: [stateFarmBureau("Farm Bureau Insurance of Michigan", "https://www.fbinsmi.com", true), AUTO_OWNERS()],
  MN: [FBFS(), AUTO_OWNERS()],
  MS: [stateFarmBureau("Mississippi Farm Bureau Insurance", "https://www.msfbins.com", true), AUTO_OWNERS()],
  MO: [SHELTER(), AUTO_OWNERS()],
  MT: [],
  NE: [FBFS()],
  NV: [],
  NH: [],
  NJ: [NJM()],
  NM: [FBFS()],
  NY: [ERIE()],
  NC: [ERIE(), stateFarmBureau("North Carolina Farm Bureau Insurance", "https://www.ncfbins.com", true), AUTO_OWNERS()],
  ND: [FBFS()],
  OH: [GRANGE(), AUTO_OWNERS()],
  OK: [stateFarmBureau("Oklahoma Farm Bureau Insurance", "https://www.ofbi.com", true)],
  OR: [FBFS()],
  PA: [ERIE()],
  RI: [AMICA()],
  SC: [stateFarmBureau("South Carolina Farm Bureau Insurance", "https://www.scfbinsurance.com", true), AUTO_OWNERS()],
  SD: [FBFS()],
  TN: [ERIE(), stateFarmBureau("Tennessee Farm Bureau Insurance", "https://www.tnfarmbureau.com", true), AUTO_OWNERS()],
  TX: [stateFarmBureau("Texas Farm Bureau Insurance", "https://www.texasfarmbureauinsurance.com", true)],
  UT: [FBFS()],
  VT: [],
  VA: [ERIE(), stateFarmBureau("Virginia Farm Bureau Insurance", "https://www.vafb.com", true), AUTO_OWNERS()],
  WA: [PEMCO()],
  WV: [ERIE(), stateFarmBureau("West Virginia Farm Bureau", "https://www.wvfarm.org", true)],
  WI: [ERIE(), AUTO_OWNERS()],
  WY: [FBFS()],
  DC: [ERIE()],
};

function regional(name, color, quoteUrl, baseMultiplier, atFaultAccidentSurcharge) {
  return {
    id: `regional_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    name,
    color,
    baseMultiplier,
    baseSource: "illustrative — no public rate data available for this carrier",
    atFaultAccidentSurcharge,
    surchargeSource: "illustrative — no public rate data available for this carrier",
    quoteUrl,
    eligibility: null,
    regional: true,
  };
}

function getRegionalCarriersForState(stateCode) {
  return REGIONAL_CARRIERS[(stateCode || "").toUpperCase()] || [];
}

module.exports = { getRegionalCarriersForState };
