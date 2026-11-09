const STATE_NAMES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia",
};

const CURRENT_INSURER_OPTIONS = [
  "GEICO", "State Farm", "Progressive", "Liberty Mutual", "Allstate", "Nationwide",
  "USAA", "A regional/local insurer", "Other",
];

const state = {};

const STORAGE_KEY = "quotely_profile_v1";

// Persisted only in this browser (localStorage) — never sent anywhere until the user
// submits a step. Wrapped in try/catch since private-browsing or blocked storage can throw.
function saveProfile() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    // storage unavailable (private mode, blocked, etc.) — fail silently, nothing breaks
  }
}

function loadSavedProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function clearSavedProfile() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    // ignore
  }
}

function setFieldValue(id, value) {
  if (value === undefined || value === null) return;
  const el = document.getElementById(id);
  if (!el) return;
  if (el.type === "checkbox") {
    el.checked = !!value;
  } else {
    el.value = value;
  }
}

function restoreSavedProfile() {
  const saved = loadSavedProfile();
  if (!saved) return;
  Object.assign(state, saved);

  setFieldValue("age", saved.age);
  setFieldValue("state", saved.state);
  setFieldValue("maritalStatus", saved.maritalStatus);
  setFieldValue("yearsLicensed", saved.yearsLicensed);
  setFieldValue("creditTier", saved.creditTier);
  setFieldValue("drivingRecord", saved.drivingRecord);
  setFieldValue("violationsCount", saved.violationsCount);
  setFieldValue("militaryHousehold", saved.militaryHousehold);
  setFieldValue("currentInsurer", saved.currentInsurer);
  setFieldValue("currentMonthlyPremium", saved.currentMonthlyPremium);
  setFieldValue("teenDriverOnPolicy", saved.teenDriverOnPolicy);
  setFieldValue("hasCoverageLapse", saved.hasCoverageLapse);
  setFieldValue("homeAutoBundle", saved.homeAutoBundle);
  setFieldValue("vehicleType", saved.vehicleType);
  setFieldValue("numVehicles", saved.numVehicles);
  setFieldValue("annualMileage", saved.annualMileage);
  setFieldValue("coverageLevel", saved.coverageLevel);
  setFieldValue("goodStudentOrDefensiveCourse", saved.goodStudentOrDefensiveCourse);
  setFieldValue("antiTheftDevice", saved.antiTheftDevice);

  document.getElementById("saved-banner").classList.remove("hidden");
}

const views = {
  intro: document.getElementById("view-intro"),
  step1: document.getElementById("view-step1"),
  step2: document.getElementById("view-step2"),
  step3: document.getElementById("view-step3"),
  results: document.getElementById("view-results"),
};

function showView(name) {
  Object.values(views).forEach((v) => v.classList.add("hidden"));
  views[name].classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function populateStateSelect() {
  const select = document.getElementById("state");
  select.innerHTML = '<option value="">Select your state</option>';
  Object.keys(STATE_NAMES)
    .sort((a, b) => STATE_NAMES[a].localeCompare(STATE_NAMES[b]))
    .forEach((code) => {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = STATE_NAMES[code];
      select.appendChild(opt);
    });
}

function populateCurrentInsurerSelect() {
  const select = document.getElementById("currentInsurer");
  CURRENT_INSURER_OPTIONS.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
}

function clearErrors(form) {
  const existing = form.querySelector(".error-banner");
  if (existing) existing.remove();
}

function showFormError(form, message) {
  clearErrors(form);
  const div = document.createElement("div");
  div.className = "error-banner";
  div.textContent = message;
  form.prepend(div);
}

document.getElementById("start-btn").addEventListener("click", () => showView("step1"));
document.getElementById("start-btn-2").addEventListener("click", () => showView("step1"));
document.getElementById("back-to-intro").addEventListener("click", () => showView("intro"));
document.getElementById("back-to-step1").addEventListener("click", () => showView("step1"));
document.getElementById("back-to-step2").addEventListener("click", () => showView("step2"));
document.getElementById("start-over-btn").addEventListener("click", () => showView("intro"));
document.getElementById("clear-saved-btn").addEventListener("click", () => {
  clearSavedProfile();
  document.getElementById("saved-banner").classList.add("hidden");
});

document.getElementById("form-step1").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  const age = Number(document.getElementById("age").value);
  const stateCode = document.getElementById("state").value;
  const yearsLicensed = Number(document.getElementById("yearsLicensed").value);

  if (!Number.isFinite(age) || age < 16 || age > 100) {
    showFormError(form, "Please enter a valid age between 16 and 100.");
    return;
  }
  if (!stateCode) {
    showFormError(form, "Please select your state.");
    return;
  }
  if (!Number.isFinite(yearsLicensed) || yearsLicensed < 0) {
    showFormError(form, "Please enter how many years you've been licensed.");
    return;
  }

  state.age = age;
  state.state = stateCode;
  state.yearsLicensed = yearsLicensed;
  state.maritalStatus = document.getElementById("maritalStatus").value;
  state.creditTier = document.getElementById("creditTier").value;
  state.drivingRecord = document.getElementById("drivingRecord").value;
  state.violationsCount = Number(document.getElementById("violationsCount").value);
  state.militaryHousehold = document.getElementById("militaryHousehold").checked;

  saveProfile();
  showView("step2");
});

document.getElementById("form-step2").addEventListener("submit", (e) => {
  e.preventDefault();
  const monthlyRaw = document.getElementById("currentMonthlyPremium").value;
  state.currentInsurer = document.getElementById("currentInsurer").value;
  state.currentMonthlyPremium = monthlyRaw === "" ? null : Number(monthlyRaw);
  state.teenDriverOnPolicy = document.getElementById("teenDriverOnPolicy").checked;
  state.hasCoverageLapse = document.getElementById("hasCoverageLapse").checked;
  state.homeAutoBundle = document.getElementById("homeAutoBundle").checked;

  saveProfile();
  showView("step3");
});

document.getElementById("form-step3").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;

  state.vehicleType = document.getElementById("vehicleType").value;
  state.numVehicles = Number(document.getElementById("numVehicles").value);
  state.annualMileage = document.getElementById("annualMileage").value;
  state.coverageLevel = document.getElementById("coverageLevel").value;
  state.goodStudentOrDefensiveCourse = document.getElementById("goodStudentOrDefensiveCourse").checked;
  state.antiTheftDevice = document.getElementById("antiTheftDevice").checked;

  saveProfile();

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Fetching estimates...";

  try {
    const res = await fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        age: state.age,
        state: state.state,
        maritalStatus: state.maritalStatus,
        creditTier: state.creditTier,
        yearsLicensed: state.yearsLicensed,
        drivingRecord: state.drivingRecord,
        violationsCount: state.violationsCount,
        militaryHousehold: state.militaryHousehold,
        currentMonthlyPremium: state.currentMonthlyPremium,
        teenDriverOnPolicy: state.teenDriverOnPolicy,
        hasCoverageLapse: state.hasCoverageLapse,
        homeAutoBundle: state.homeAutoBundle,
        vehicleType: state.vehicleType,
        numVehicles: state.numVehicles,
        annualMileage: state.annualMileage,
        coverageLevel: state.coverageLevel,
        goodStudentOrDefensiveCourse: state.goodStudentOrDefensiveCourse,
        antiTheftDevice: state.antiTheftDevice,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.details ? body.details.join("; ") : "Could not fetch estimates.");
    }

    const data = await res.json();
    renderResults(data);
    showView("results");
  } catch (err) {
    showFormError(form, err.message || "Something went wrong. Please try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "See my estimates";
  }
});

function money(n) {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

const DRIVING_RECORD_LABELS = {
  clean: "Clean — no claims or violations",
  not_at_fault_claim: "One not-at-fault claim",
  speeding_ticket: "One speeding ticket",
  at_fault_accident: "One at-fault accident",
  dui: "DUI / major violation",
};
const VEHICLE_TYPE_LABELS = {
  sedan: "Sedan", suv: "SUV", truck: "Truck", minivan: "Minivan",
  sports: "Sports car", luxury: "Luxury", ev: "Electric vehicle",
};
const MILEAGE_LABELS = {
  low: "Under 7,500 mi/yr", medium: "7,500–12,000 mi/yr",
  high: "12,000–20,000 mi/yr", very_high: "Over 20,000 mi/yr",
};
const COVERAGE_LABELS = {
  liability: "Liability only (state minimum)",
  standard: "Full coverage (standard deductible)",
  full_low_deductible: "Full coverage (low deductible)",
};
const CREDIT_TIER_LABELS = {
  excellent: "Excellent", good: "Good", fair: "Fair",
  poor: "Poor / building credit", not_shared: "Prefer not to say",
};

// Plain-text profile summary to paste into a carrier's own quote form — real carrier quote
// apps (checked GEICO and Progressive directly) don't accept prefill via URL, so this is the
// fastest reliable way to carry your answers over without retyping them one field at a time.
// Never includes SSN, driver's license, or payment info — Quotely never collects those.
function buildProfileSummaryText() {
  const lines = [
    `Age: ${state.age ?? ""}`,
    `State: ${STATE_NAMES[state.state] || state.state || ""}`,
    `Marital status: ${state.maritalStatus === "married" ? "Married" : "Single"}`,
    `Years licensed: ${state.yearsLicensed ?? ""}`,
    `Credit tier: ${CREDIT_TIER_LABELS[state.creditTier] || ""}`,
    `Driving record: ${DRIVING_RECORD_LABELS[state.drivingRecord] || ""}`,
    `Additional violations (last 3 yrs): ${state.violationsCount || 0}`,
    `Vehicle type: ${VEHICLE_TYPE_LABELS[state.vehicleType] || ""}`,
    `Vehicles on policy: ${state.numVehicles ?? 1}`,
    `Annual mileage: ${MILEAGE_LABELS[state.annualMileage] || ""}`,
    `Coverage level: ${COVERAGE_LABELS[state.coverageLevel] || ""}`,
  ];
  if (state.militaryHousehold) lines.push("Military/veteran household: Yes");
  if (state.teenDriverOnPolicy) lines.push("Teen driver on policy: Yes");
  if (state.hasCoverageLapse) lines.push("Lapse in coverage: Yes");
  if (state.homeAutoBundle) lines.push("Would bundle home/renters insurance: Yes");
  if (state.goodStudentOrDefensiveCourse) lines.push("Good student / defensive driving discount: Yes");
  if (state.antiTheftDevice) lines.push("Anti-theft device: Yes");
  return lines.join("\n");
}

function showCopyFallback(text) {
  let box = document.getElementById("profile-copy-fallback");
  if (!box) {
    box = document.createElement("textarea");
    box.id = "profile-copy-fallback";
    box.className = "copy-fallback";
    box.readOnly = true;
    document.getElementById("copy-profile-btn").insertAdjacentElement("afterend", box);
  }
  box.value = text;
  box.classList.remove("hidden");
  box.focus();
  box.select();
}

async function copyProfileToClipboard(button) {
  const text = buildProfileSummaryText();
  const original = button.textContent;
  try {
    if (!navigator.clipboard) throw new Error("clipboard API unavailable");
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied ✓";
  } catch (err) {
    button.textContent = "Select the text below and copy it";
    showCopyFallback(text);
  }
  setTimeout(() => { button.textContent = original; }, 2500);
}

function renderFactors(factors) {
  return factors
    .map((f) => {
      const source = f.source ? ` <span class="factor-source">(${f.source})</span>` : "";
      if (f.multiplier === undefined) {
        return `<li>${f.label}: starts at ${money(f.amount)}/yr${source}</li>`;
      }
      const pct = Math.round((f.multiplier - 1) * 100);
      const sign = pct > 0 ? "+" : "";
      return `<li>${f.label}: ${sign}${pct}% → running total ${money(f.runningAnnual)}/yr${source}</li>`;
    })
    .join("");
}

function renderResults(data) {
  const { quotes, summary } = data;
  const best = quotes[0];
  const summaryEl = document.getElementById("results-summary");
  const bestEl = document.getElementById("best-match");
  const listEl = document.getElementById("results-list");

  if (summary.personalized) {
    const p = summary.personalized;
    const savingsLine = p.annualSavings > 0
      ? `<div class="savings">${money(p.annualSavings / 12)}/mo (${money(p.annualSavings)}/yr, ${p.percentSavings}%)</div>
         <p>less than the ${money(p.currentAnnualPremium / 12)}/mo you told us you're paying now.</p>`
      : `<div class="savings small">You're already near the best estimate we found.</div>
         <p>Your current ${money(p.currentAnnualPremium / 12)}/mo is close to our lowest match — still worth double-checking the real quote.</p>`;
    summaryEl.innerHTML = `<h2>Your personalized savings</h2>${savingsLine}`;
  } else {
    summaryEl.innerHTML = `
      <h2>Your estimated price range</h2>
      <div class="savings">Up to ${money(summary.estimatedAnnualSavings)}/yr</div>
      <p>difference between the highest and lowest estimate for your profile, across ${quotes.length} insurers.</p>
    `;
  }

  bestEl.innerHTML = `
    <div class="best-match-label">Quotely's pick for you</div>
    <div class="best-match-body">
      <div class="best-match-carrier">
        <div class="carrier-swatch" style="background:${best.color}"></div>
        <div>
          <div class="carrier-name-lg">${best.carrierName}</div>
          <div class="carrier-price-lg">${money(best.annualPremium)}/yr &middot; ${money(best.monthlyPremium)}/mo</div>
          ${best.note ? `<div class="carrier-note">${best.note}</div>` : ""}
        </div>
      </div>
      <a class="btn btn-primary btn-lg" href="${best.quoteUrl}" target="_blank" rel="noopener noreferrer">
        Start my switch to ${best.carrierName} →
      </a>
    </div>
    <p class="best-match-fine">
      Quotely compared ${quotes.length} insurers against your exact profile. ${best.carrierName} still has
      to legally write the policy, so this link takes you there to lock in the rate — we don't sell
      your info or take a referral fee in this demo. Carrier sites don't accept pre-filled links
      (we checked), so copy your answers below to paste in instead of retyping them.
    </p>
    <button type="button" class="btn btn-ghost" id="copy-profile-btn">Copy my info to paste there</button>
    <details class="why-this-price">
      <summary>Why this price?</summary>
      <ul>${renderFactors(best.factors)}</ul>
    </details>
  `;

  document.getElementById("copy-profile-btn").addEventListener("click", (e) => {
    copyProfileToClipboard(e.target);
  });

  listEl.innerHTML = "";
  quotes.forEach((q, idx) => {
    const card = document.createElement("div");
    card.className = "quote-card" + (idx === 0 ? " best" : "");
    card.innerHTML = `
      <div class="quote-card-top">
        <div class="quote-carrier">
          <div class="carrier-swatch" style="background:${q.color}"></div>
          <div>
            <div class="carrier-name">${q.carrierName}${idx === 0 ? '<span class="best-badge">Lowest estimate</span>' : ""}${q.regional ? '<span class="regional-badge">Regional pick for your state</span>' : ""}</div>
            ${q.note ? `<div class="carrier-note">${q.note}</div>` : ""}
          </div>
        </div>
        <div class="quote-price">
          <div class="annual">${money(q.annualPremium)}/yr</div>
          <div class="monthly">${money(q.monthlyPremium)}/mo</div>
        </div>
      </div>
      <details class="why-this-price">
        <summary>Why this price?</summary>
        <ul>${renderFactors(q.factors)}</ul>
      </details>
      <div class="quote-actions">
        <a href="${q.quoteUrl}" target="_blank" rel="noopener noreferrer">Get real quote →</a>
      </div>
    `;
    listEl.appendChild(card);
  });
}

populateStateSelect();
populateCurrentInsurerSelect();
restoreSavedProfile();
