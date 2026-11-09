# CLAUDE.md

## What this is

Quotely — a local/demo web app (UVA COMM 4680 Entrepreneurship project) that estimates and
compares car insurance premiums across national carriers and state-specific regional insurers.
It is **not** a real insurance quoting service: it does not scrape, call, or integrate with any
live carrier API. Every number comes from a transparent, factor-based rate model built from
published public data where available, clearly labeled "illustrative" where not.

## Tech stack

- Backend: Node.js + Express (`server.js`, no framework beyond Express)
- Frontend: vanilla HTML/CSS/JS, no build step, no framework — `public/` served as static files
- No database — a flat local JSON file (`data/stats.json`, gitignored) tracks usage/feedback
  counts only; not used for the rating logic
- No external API calls, no auth, no payment processing, no PII collection

## Run it

```bash
npm install
npm start   # serves http://localhost:4321 (or $PORT)
```

No automated test suite exists yet (see `docs/PROJECT_STATUS.md`).

## Architecture

- **`server.js`** — Express app: static file serving + 4 JSON endpoints.
  - `POST /api/quote` — validates input, calls `lib/rateEngine.getQuotes()`, records a completion.
  - `GET /api/states` — valid state codes.
  - `POST /api/feedback` — records a tester reaction (`meh`/`interested`/`hell_yes`) + comment.
  - `GET /api/stats` — aggregate usage/feedback counts (read by `public/stats.html`).
- **`lib/rateEngine.js`** — the pricing model. Starts from a $2,339/yr national baseline
  (NerdWallet, Jan 2026) and multiplies through ~20 factors (age, vehicle, state, credit tier,
  driving record, etc.) per carrier. Every factor is pushed into a `factors[]` array with its own
  multiplier + `source` string, which the frontend renders as "Why this price?" — this
  transparency is the app's core trust mechanism, not an implementation detail.
- **`lib/carriers.js`** — 7 national carrier profiles (GEICO, State Farm, Progressive, Liberty
  Mutual, Allstate, Nationwide, USAA) + the generic "Local independent agents" fallback.
- **`lib/regionalCarriers.js`** — per-state arrays of real regional/state-specific carriers
  (Erie, Mercury, NJM, state Farm Bureau affiliates, Auto-Owners, etc.). 0–3 named candidates per
  state; the generic fallback is always added on top in `rateEngine.js`.
- **`lib/stateFactors.js`** — relative cost-of-insurance index per state. Only 5 states (AL, AK,
  FL, GA, LA) trace to a real Bankrate figure; the rest are labeled illustrative.
- **`lib/vehicleModels.js`** — ~13 specific make/model combos with real published rate
  multipliers (Insurance.com/CarInsurance.com 2026). Falls back to the generic body-style
  (`vehicleType`) factor in `rateEngine.js` when unmatched.
- **`lib/store.js`** — flat-file JSON tracker (`data/stats.json`). Explicitly **not durable** on
  Render's free tier (filesystem may reset on spin-down/restart).
- **`public/index.html`** — single-page app: hero + 3-step form + results, all in one DOM,
  toggled by a `hidden` CSS class (`showView()` in `app.js`).
- **`public/app.js`** — client-side logic: form state, localStorage profile persistence (key
  `quotely_profile_v1`), API calls, results rendering, feedback widget, "copy my info" clipboard
  helper with a visible-textbox fallback.
- **`public/stats.html`** — presenter-only dashboard (not linked from the public site), polls
  `GET /api/stats`.
- **`public/styles.css`** — plain CSS, custom properties for the neutral/navy/orange palette.

## Key conventions

- **Every priced factor in `rateEngine.js` must carry a `source` string** — a real citation (e.g.
  `"Bankrate, Feb 2026"`) or an explicit `"illustrative — ..."` label. Never ship a number without
  one or the other. This is the single most important convention here.
- Only use real company names for real companies; note confidence inline where it's shaky (see
  `stateFarmBureau()`'s `lowConfidence` flag, which surfaces a caveat in the UI).
- No PII anywhere: no SSN, full name, license number, or payment info in the form or validation
  layer. Don't add any.
- `server.js`'s `validateInput()` is the single source of truth for allowed enum values — keep it
  in sync with `<select>` options in `index.html` and with the rate-engine's factor tables.
- No build step, bundler, TypeScript, or CSS framework — match the existing vanilla style.
- Local dev port defaults to 4321 (`process.env.PORT || 4321`); Render sets its own `PORT`.

## Constraints — do not do these

- Do not add live carrier scraping or automated form-filling against GEICO/State Farm/etc. —
  ruled out deliberately (ToS, bot-detection, and PII-handling concerns). Real quotes require
  carrier/rating-vendor API access via an insurance producer license, not scraping.
- Do not invent a specific numeric source for a factor that isn't actually backed by one — use
  the existing "illustrative" label pattern instead.
- `data/` is gitignored and must stay that way — it can contain tester feedback comments.

## Deployment

- Render (free tier): https://quotelyinsurance.onrender.com — auto-deploys from GitHub `main`.
- GitHub: https://github.com/sabrinali11/quotely (public).
- See `docs/PROJECT_STATUS.md` for what's actually live vs. only committed locally.
