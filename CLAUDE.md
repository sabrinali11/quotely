# CLAUDE.md

## What this is

Quotely — a local/demo web app (UVA COMM 4680 Entrepreneurship project) that estimates and
compares car insurance premiums across national carriers and state-specific regional insurers,
then keeps watching a saved quote and alerts the user if it finds something cheaper. It is
**not** a real insurance quoting service: it does not scrape, call, or integrate with any live
carrier API. Every number comes from a transparent, factor-based rate model built from published
public data where available, clearly labeled "illustrative" where not.

The "agent" framing (compare once, then keep re-checking on a schedule and only bother the user
when there's an actual improvement) is the product's core pitch, not just the intake form. See
"Quote monitoring" under Architecture below.

## Tech stack

- Backend: Node.js + Express (`server.js`, no framework beyond Express)
- Frontend: vanilla HTML/CSS/JS, no build step, no framework — `public/` served as static files
- Rate-engine itself is still stateless. Quote-monitoring **subscriptions** are persisted in a
  local SQLite file (`data/subscriptions.db`, gitignored, via Node's built-in `node:sqlite` —
  no external database, account, or extra dependency). Deliberately **not** a hosted Postgres
  (Neon/Supabase, etc.) — ruled out per the user; don't reintroduce one without asking again.
- A flat local JSON file (`data/stats.json`, gitignored) still tracks usage/feedback counts only;
  unrelated to the rating logic or to subscriptions.
- No auth, no payment processing. SMS is **mocked** (`lib/sms.js` logs what it would have sent —
  no Twilio/carrier account exists yet). No live carrier API calls (see Constraints).
- Phone numbers are now collected, but only for the monitoring opt-in, only with an explicit
  consent checkbox, and only used to address the (mock) SMS send — see Key conventions.

## Run it

```bash
npm install
npm start   # serves http://localhost:4321 (or $PORT)
```

Environment variables (both optional):

| Var | Purpose | If unset |
|---|---|---|
| `CRON_SCHEDULE` | cron expression for the recurring check cycle | defaults to daily at 9am |
| `PORT` | HTTP port | defaults to 4321 |

Requires Node ≥22.5 (`engines` in `package.json`, `.node-version`) for the built-in `node:sqlite`
module used by subscriptions. If deploying somewhere that doesn't let you pin a Node version,
check it supports this before relying on quote-monitoring persistence.

`POST /api/monitor/run-now` fires a check cycle immediately without waiting for the schedule —
useful for local testing and demos (see Architecture).

No automated test suite exists yet (see `docs/PROJECT_STATUS.md`).

## Architecture

- **`server.js`** — Express app: static file serving + JSON endpoints.
  - `POST /api/quote` — validates input, calls `lib/rateEngine.getQuotes()`, records a completion.
  - `GET /api/states` — valid state codes.
  - `POST /api/feedback` — records a tester reaction (`meh`/`interested`/`hell_yes`) + comment.
    **Orphaned**: the in-app feedback widget that called this was removed from the UI; the
    endpoint and `lib/store.js` still work, nothing currently posts to them.
  - `GET /api/stats` — aggregate usage/feedback counts (read by `public/stats.html`).
  - `POST /api/subscribe` — validates the same quote input as `/api/quote` plus `phoneNumber`,
    `frequency` (`weekly`/`monthly`), and `consent` (must be `true`); prices the quote once, then
    creates a monitoring subscription via `lib/subscriptions.js`.
  - `GET /api/subscriptions/:id` — status lookup (best price/carrier found so far, last checked).
  - `POST /api/subscriptions/:id/cancel` — cancels a subscription.
  - `POST /api/monitor/run-now` — manually fires `lib/monitor.runCheckCycle()` instead of waiting
    for the cron schedule; a demo/testing helper, not auth-gated (nothing it does is unsafe — it
    only re-prices stored inputs and mock-sends SMS).
- **`lib/rateEngine.js`** — the pricing model. Starts from a $2,339/yr national baseline
  (NerdWallet, Jan 2026) and multiplies through ~20 factors (age, vehicle, state, credit tier,
  driving record, etc.) per carrier. Every factor is pushed into a `factors[]` array with its own
  multiplier + `source` string, which the frontend renders as "Why this price?" — this
  transparency is the app's core trust mechanism, not an implementation detail.
- **`lib/carriers.js`** — 7 national carrier profiles (GEICO, State Farm, Progressive, Liberty
  Mutual, Allstate, Nationwide, USAA) + the generic "Local independent agents" fallback.
- **`lib/regionalCarriers.js`** — per-state arrays of real regional/state-specific carriers
  (Erie, Mercury, NJM, state Farm Bureau affiliates, Auto-Owners, Umialik, DTRIC, MMG, Concord
  Group, Co-operative, etc.). 0–3 named candidates per state; the generic fallback is always
  added on top in `rateEngine.js`. Only CO, DE, MT, NV currently have zero named candidates — no
  confident real regional carrier was found for them (don't invent one; leave the gap honest).
- **`lib/stateFactors.js`** — relative cost-of-insurance index per state. Only 5 states (AL, AK,
  FL, GA, LA) trace to a real Bankrate figure; the rest are labeled illustrative.
- **`lib/vehicleModels.js`** — ~13 specific make/model combos with real published rate
  multipliers (Insurance.com/CarInsurance.com 2026). Falls back to the generic body-style
  (`vehicleType`) factor in `rateEngine.js` when unmatched.
- **`lib/store.js`** — flat-file JSON tracker (`data/stats.json`). Explicitly **not durable** on
  Render's free tier (filesystem may reset on spin-down/restart).
- **`lib/db.js`** — opens/creates the local SQLite file (`data/subscriptions.db`) via
  `node:sqlite`'s `DatabaseSync` and ensures the `subscriptions` table exists.
- **`lib/subscriptions.js`** — CRUD for monitoring subscriptions against that SQLite file.
  `getDueSubscriptions()` compares `lastCheckedAt` (or `createdAt` if never checked) against a
  7-day/30-day interval based on `frequency`.
- **`lib/monitor.js`** — `runCheckCycle()`: re-runs `rateEngine.getQuotes()` for every due
  subscription's stored input, mock-texts the user only if the new best price is lower than the
  stored one, and updates the stored best price/carrier either way. This is "the agent" — see
  What this is.
- **`lib/sms.js`** — **mock** SMS sender. Logs `[MOCK SMS] to ***-***-1234: <body>` to the console
  and appends a masked-phone record to `data/sms-log.json` (gitignored). No Twilio/carrier
  integration exists — see Constraints before adding one.
- **`public/index.html`** — single-page app: hero + 3-step form + results, all in one DOM,
  toggled by a `hidden` CSS class (`showView()` in `app.js`). Results view includes a "Keep
  watching this quote for me" card (`#track-quote`) with the subscribe form.
- **`public/app.js`** — client-side logic: form state, localStorage profile persistence (key
  `quotely_profile_v1`), API calls, results rendering, "copy my info" clipboard helper with a
  visible-textbox fallback, and the watch/unwatch flow for `#track-quote` (subscription id cached
  in localStorage under `quotely_subscription_v1`; status is only re-checked after a fresh quote
  is fetched, not on a bare page reload — a known gap, see `docs/PROJECT_STATUS.md`). (No feedback
  UI — removed per user request; see `server.js` note.)
- **`public/stats.html`** — presenter-only dashboard (not linked from the public site), polls
  `GET /api/stats`.
- **`public/styles.css`** — plain CSS, custom properties for the neutral/navy/orange palette.

## Key conventions

- **Every priced factor in `rateEngine.js` must carry a `source` string** — a real citation (e.g.
  `"Bankrate, Feb 2026"`) or an explicit `"illustrative — ..."` label. Never ship a number without
  one or the other. This is the single most important convention here.
- Only use real company names for real companies; note confidence inline where it's shaky (see
  `stateFarmBureau()`'s `lowConfidence` flag, which surfaces a caveat in the UI).
- No SSN, full name, license number, or payment info anywhere, in the form or validation layer —
  don't add any. Phone number is the one deliberate exception, collected only through
  `/api/subscribe` with an explicit, un-checked-by-default consent checkbox, used only to address
  the (currently mocked) SMS send. Don't start collecting phone numbers anywhere else in the app
  without the same explicit-consent pattern.
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
- `data/` is gitignored and must stay that way — it can contain tester feedback comments and the
  mock SMS log.
- Do not wire up a real SMS provider (Twilio or otherwise) without the user explicitly asking —
  that means a real account, real credentials, and per-message cost. `lib/sms.js` must stay mock
  until that happens.
- Do not switch `node-cron` for anything else (an external scheduler, a paid Render Cron Job,
  etc.) without the user asking — this was a deliberate tradeoff knowing in-process cron won't
  reliably fire on Render's free tier once the app spins down from inactivity. `POST
  /api/monitor/run-now` exists specifically to compensate for that in testing/demos.

## Deployment

- Render (free tier): https://quotelyinsurance.onrender.com — auto-deploys from GitHub `main`.
- GitHub: https://github.com/sabrinali11/quotely (public).
- Render must be running Node ≥22.5 for `node:sqlite` (see `.node-version`/`engines` above) — if
  Render's build log shows an older Node, quote-monitoring will fail to start.
- Like `data/stats.json`, `data/subscriptions.db` is **not durable** on Render's free tier — its
  ephemeral filesystem isn't guaranteed to survive a spin-down/restart. There is no account-free
  way to fix that on Render's free tier specifically; it would need either a paid persistent disk
  or a hosted database, both deliberately out of scope per the user. Locally, this file is fully
  durable across restarts.
- See `docs/PROJECT_STATUS.md` for what's actually live vs. only committed locally.
