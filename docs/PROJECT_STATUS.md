# Project Status — Quotely

Last updated: 2026-11-09

## What Quotely is

A local/demo web app built for a UVA COMM 4680 (Entrepreneurship) MVBP assignment. It simulates
"Quotely" — an AI agent that compares car insurance across carriers, pitched in the team's deck
(Joey DeLuca, Sabrina Li, Zayan Meah, Mateo Zuleta). The deployed app is a working prototype used
to collect real test-user reactions for the course's customer-validation requirement ("prove it's
valued," "prove a customer put skin in the game," "meh → Hell Yes" spectrum). It does not perform
live insurance quoting.

## Implemented features

- 3-step intake form (~24 fields): driver/record → current policy/household → vehicle/coverage.
  Covers age, state, marital status, years licensed, credit tier, driving record + violation
  count, military household, current insurer + premium, teen driver, coverage lapse, home/auto
  bundle, vehicle make/model/year, vehicle type, ownership status (own/financing/leasing),
  primary use (pleasure/commute/business), vehicle count, annual mileage, coverage level,
  good-student/defensive-driving discount, anti-theft device.
- Transparent rate engine producing a ranked list of carrier quotes with a cited, factor-by-factor
  "Why this price?" breakdown for every quote.
- 7 national carriers + per-state regional carriers (0–3 real named candidates per state + a
  generic independent-agent floor) — see `lib/regionalCarriers.js` for exact per-state coverage.
  Only CO, DE, MT, and NV currently have zero named candidates; every other state has at least one
  real, verified regional carrier (most recently added: Umialik/AK, DTRIC/HI, MMG/ME, Concord
  Group/NH, Co-operative/VT).
- Vehicle make/model-specific pricing for ~13 well-documented models (real 2026 data), falling
  back to generic body-style pricing otherwise.
- Personalized savings calculation when the user enters their current monthly premium.
- "Copy my info" clipboard helper (with a visible-textbox fallback) — real carrier sites don't
  accept pre-filled quote links, confirmed by testing GEICO and Progressive directly.
- Browser localStorage persistence of the user's last answers (`quotely_profile_v1`), with a
  "Welcome back" banner and a clear-data control.
- ~~Lightweight usage tracking + in-app feedback widget~~ — **built, then removed per user
  request.** The backend (`POST /api/feedback`, `GET /api/stats`, `lib/store.js`, and
  `public/stats.html`) is still in place and functional but nothing in the UI calls it anymore;
  `/api/quote` still increments a quote-completion counter via `lib/store.js`. Treat this as
  orphaned code unless a future session is asked to either remove it fully or re-wire a UI to it.
- Neutral/navy/orange visual design (iterated through, then reverted from, a neubrutalist pass).
- Deployed to Render (free tier) at quotelyinsurance.onrender.com, connected to the public GitHub
  repo `sabrinali11/quotely` for auto-deploy on push to `main`.

## Current state — what's live vs. not

Everything is in sync as of 2026-11-09: local working tree is clean, local `main` and
`origin/main` point at the identical commit, and the live Render deployment
(quotelyinsurance.onrender.com) has been directly verified to match — tested the Hawaii/DTRIC
regional carrier, the Honda CR-V vehicle-model lookup, and the absence of the removed feedback
widget against the live URL itself, not just assumed from the push succeeding.

Render's GitHub App is connected (previously it was linked via "Public Git Repository," which
gets no webhook and silently never auto-deploys after the first push — found and fixed this
session). A normal `git push origin main` now redeploys automatically within ~10-20 seconds; no
manual "Deploy latest commit" step is needed. This was confirmed with a real test push, not just
assumed from the settings.

## Known gaps / limitations

1. **No automated tests exist.** All verification so far has been manual (curl + browser testing
   during development). Worth adding at least smoke tests for `lib/rateEngine.js` given how
   central it is.
2. **Render free-tier disk is not durable** — `lib/store.js`'s quote-count/feedback data can be
   lost on a spin-down/restart. Do any real tester session in one sitting and screenshot
   `/stats.html` right after, rather than relying on data surviving across days.
3. **Rate data fidelity varies by factor** — see "Data & assumptions" below. Some factors are
   cited to real 2026 published figures; several are explicitly labeled "illustrative."
4. **No real carrier integration is possible without an insurance producer license** — a
   deliberate, discussed scope boundary, not an oversight (see `CLAUDE.md` → Constraints).
5. The homepage's static marketing stats (separate from the rate engine) include one citation
   ("Amaro Law Firm," a ~$1,000+/yr claim) that could not be verified in a fact-check pass and was
   flagged to the user as likely unreliable. It has **not** been removed/replaced as of this
   writing.
6. A stray git repository rooted at the user's home directory (`/Users/sabrinali`) was discovered
   on this machine — it tracks two unrelated static-site projects under `~/Downloads` and has its
   own GitHub remote (`uva-peaks-profs`). It was flagged to the user and left untouched; it is not
   part of Quotely and this project's `.git` is a separate, independent repo.

## Pending / suggested next steps

- Decide whether to fix the homepage's unverified "Amaro Law Firm" citation (drop it, or replace
  with a verified source) — this was offered to the user previously and not yet actioned.
- If expanding rating factors further, keep following the "every factor needs a `source` string"
  convention (see `CLAUDE.md`).
- No outstanding bug reports from the user as of this writing.

## Data & assumptions (verified against code as of this writing)

National baseline: **$2,339/yr** (NerdWallet, Jan 2026) — `lib/rateEngine.js`, `NATIONAL_BASE_ANNUAL`.

| Factor | Status | Source (if cited) |
|---|---|---|
| GEICO / State Farm base price | Verified real | ValuePenguin, 2026 |
| GEICO / State Farm accident surcharge | Verified real | MoneyGeek |
| Progressive base price | Verified real | NerdWallet, Apr 2026 |
| Allstate base price | Verified real | insurance.com, 2026 |
| USAA base price | Verified real | LendingTree, 2026 |
| Liberty Mutual / Nationwide base price | Lower confidence | autoinsurance.com, not cross-checked elsewhere |
| Progressive/Liberty Mutual/Allstate/Nationwide/USAA accident surcharge | Illustrative fallback | MoneyGeek's national average (48.8%); no carrier-specific figure found |
| Credit tier | Verified real | Bankrate, Feb 2026 |
| Teen driver surcharge | Verified real | CarInsurance.com, 2026 |
| State risk — AL, AK, FL, GA, LA only | Verified real | Bankrate, 2026 |
| State risk — all other states | Illustrative | General reported regional patterns, not individually sourced filed rates |
| Regional carrier identities (company names, states of operation) | Real companies | Most re-verified via live web search in-session (Erie's multi-state footprint, Umialik/AK, DTRIC/HI, MMG/ME, Concord Group/NH, Co-operative/VT); a few earlier entries (e.g. some state Farm Bureau domains) are unverified domain guesses, flagged in the UI as "lower confidence" |
| Regional carrier rate multipliers | Illustrative | No public per-carrier rate data exists for these smaller insurers |
| Vehicle make/model (13 specific models) | Verified real | Insurance.com / CarInsurance.com, 2026 |
| Vehicle age/depreciation curve | Illustrative | Own estimate, not a specific sourced table |
| Ownership status (own/financing/leasing) | Illustrative magnitude | Direction is real (Bankrate/Experian); exact percentages are an estimate |
| Primary use (pleasure/commute/business) | Illustrative | Within a published <5% range for commute; no single sourced figure for business |
| Homepage marketing stats (separate from rate engine) | Mixed | 48% accident-increase and 42%-don't-understand-policy stats are verified (NerdWallet / J.D. Power); "Amaro Law Firm" claim is unverified — see Known Gaps #5 |

Keep this table current: if a new rating factor is added, add a row here with the same
Verified/Illustrative labeling used throughout the codebase.

## Architecture / files

See `CLAUDE.md` for the full file-by-file breakdown. If this status doc and `CLAUDE.md` ever
diverge on architecture facts, check `git log` for what actually changed most recently.
