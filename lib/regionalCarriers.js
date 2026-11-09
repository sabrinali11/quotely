// Real regional/state-domiciled auto insurers that often underprice the national
// carriers inside their home footprint. This is illustrative rate modeling for the
// Quotely demo, not verified current availability or filed rates — always confirm
// directly with the carrier. Where we don't have a confident regional pick for a
// state, getRegionalCarrierForState() falls back to the generic independent-agent
// entry in carriers.js.
const REGIONAL_CARRIERS = {
  // Erie Insurance's real multi-state mid-Atlantic/Midwest footprint
  PA: regional("Erie Insurance", "#0056A4", "https://www.erieinsurance.com/auto-insurance"),
  MD: regional("Erie Insurance", "#0056A4", "https://www.erieinsurance.com/auto-insurance"),
  WV: regional("Erie Insurance", "#0056A4", "https://www.erieinsurance.com/auto-insurance"),
  VA: regional("Erie Insurance", "#0056A4", "https://www.erieinsurance.com/auto-insurance"),
  NC: regional("Erie Insurance", "#0056A4", "https://www.erieinsurance.com/auto-insurance"),
  KY: regional("Erie Insurance", "#0056A4", "https://www.erieinsurance.com/auto-insurance"),
  IN: regional("Erie Insurance", "#0056A4", "https://www.erieinsurance.com/auto-insurance"),
  NY: regional("Erie Insurance", "#0056A4", "https://www.erieinsurance.com/auto-insurance"),
  WI: regional("Erie Insurance", "#0056A4", "https://www.erieinsurance.com/auto-insurance"),
  CT: regional("Erie Insurance", "#0056A4", "https://www.erieinsurance.com/auto-insurance"),
  DC: regional("Erie Insurance", "#0056A4", "https://www.erieinsurance.com/auto-insurance"),

  CA: regional("Mercury Insurance", "#C8102E", "https://www.mercuryinsurance.com/auto-insurance.html"),
  NJ: regional("NJM Insurance Group", "#00558C", "https://www.njm.com/insurance/auto"),
  RI: regional("Amica Mutual", "#003DA5", "https://www.amica.com/en/auto-insurance.html"),
  MO: regional("Shelter Insurance", "#C8102E", "https://www.shelterinsurance.com/insurance/auto"),
  IL: regional("COUNTRY Financial", "#00843D", "https://www.countryfinancial.com/en/insurance/auto.html"),
  WA: regional("PEMCO Insurance", "#004B8D", "https://www.pemco.com/insurance/auto"),
  OH: regional("Grange Insurance", "#004B87", "https://www.grangeinsurance.com/personal/auto"),
  MA: regional("Commerce Insurance", "#004B87", "https://www.commerceinsurance.com/"),

  // Farm Bureau Financial Services' core Midwest/Mountain West states
  IA: regional("Farm Bureau Financial Services", "#2E7D32", "https://www.fbfs.com/products/auto-insurance"),
  NE: regional("Farm Bureau Financial Services", "#2E7D32", "https://www.fbfs.com/products/auto-insurance"),
  KS: regional("Farm Bureau Financial Services", "#2E7D32", "https://www.fbfs.com/products/auto-insurance"),
  MN: regional("Farm Bureau Financial Services", "#2E7D32", "https://www.fbfs.com/products/auto-insurance"),
  SD: regional("Farm Bureau Financial Services", "#2E7D32", "https://www.fbfs.com/products/auto-insurance"),
  ND: regional("Farm Bureau Financial Services", "#2E7D32", "https://www.fbfs.com/products/auto-insurance"),
  AZ: regional("Farm Bureau Financial Services", "#2E7D32", "https://www.fbfs.com/products/auto-insurance"),
  UT: regional("Farm Bureau Financial Services", "#2E7D32", "https://www.fbfs.com/products/auto-insurance"),
  WY: regional("Farm Bureau Financial Services", "#2E7D32", "https://www.fbfs.com/products/auto-insurance"),
  NM: regional("Farm Bureau Financial Services", "#2E7D32", "https://www.fbfs.com/products/auto-insurance"),
  ID: regional("Farm Bureau Financial Services", "#2E7D32", "https://www.fbfs.com/products/auto-insurance"),
  OR: regional("Farm Bureau Financial Services", "#2E7D32", "https://www.fbfs.com/products/auto-insurance"),
};

function regional(name, color, quoteUrl) {
  return {
    id: `regional_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    name,
    color,
    // No public per-carrier rate data exists for these regional/mutual insurers (they don't
    // publish the way national carriers do) — this stays an illustrative discount consistent
    // with the deck's point that in-footprint regional carriers often underprice nationals.
    baseMultiplier: 0.84,
    baseSource: "illustrative — no public rate data available for this carrier",
    atFaultAccidentSurcharge: 0.28,
    surchargeSource: "illustrative — no public rate data available for this carrier",
    quoteUrl,
    eligibility: null,
    regional: true,
  };
}

function getRegionalCarrierForState(stateCode) {
  return REGIONAL_CARRIERS[(stateCode || "").toUpperCase()] || null;
}

module.exports = { getRegionalCarrierForState };
