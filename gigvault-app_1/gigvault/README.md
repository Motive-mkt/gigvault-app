# GigVault — Dash Cluster build

Instrument-cluster themed gig-worker income & tax tracker. React Native (Expo),
sold as an APK on Whop — no Play Store, no subscription, no Firestore.

## Verification performed

Before delivery, this codebase was tested for real, not just written and assumed
correct:

- **Syntax**: every `.js` file parsed cleanly with Babel (JSX included)
- **Imports**: every cross-file import checked against the actual exports of its
  target file — zero mismatches
- **Dependency versions**: originally pinned to Expo SDK 51 (mid-2024) — found and
  corrected to SDK 57, the current version, using Expo's own bundled compatibility
  manifest. The SDK 51 versions were producing a real broken install.
- **Production bundle**: ran an actual Metro bundle export (`expo export --platform android`)
  — all 813 modules across every screen, component, and the database layer
  compiled into a working Android JS bundle with zero errors
- **Database logic**: 18 tests run against a real SQLite engine covering settings
  read/write, platform seeding, entry logging, date-range queries, platform
  breakdown aggregation, mileage totals, and the `CHECK` constraint on entry type
  — all passing
- **Date/chart logic**: 19 tests covering week/month/year boundaries, leap years,
  and the Monday/Sunday edge cases in the day-bucketing logic that powers the
  dashboard's route chart — all passing
- **CSV export logic**: 12 tests covering field escaping (commas, quotes,
  newlines) and full-row generation — all passing
- **Lint**: ESLint with React and React Hooks rules — clean, after removing two
  unused imports and fixing three JSX apostrophe-encoding warnings

## Status: feature-complete

Every screen is wired to a real local SQLite database. No more mock data.

## App flow

```
App launch
  → load fonts (Sora + IBM Plex Mono)
  → init SQLite (creates tables on first run)
  → licensed?  no → LicenseScreen (enter Whop key, verified via your proxy)
  → onboarded? no → OnboardingFlow (name → platforms → tax rate → budget caps)
  → main tab shell (Dashboard / Log / Charts / Tax / Settings)
```

## What's built

**Core**
- `src/theme/theme.js` — Dash Cluster color/font/spacing tokens
- `src/db/database.js` — SQLite schema (settings, platforms, entries) + all CRUD/query functions
- `src/utils/dateRanges.js` — week/month/year range helpers, daily bucketing for charts
- `src/utils/csvExport.js` — CSV generation + native share sheet for exports

**Components**
- `GaugeArc.js` — big semicircle gauge (weekly earnings, tax set-aside)
- `MiniGauge.js` — compact paired gauge (daily cap, tax mini-stat)
- `NightRoute.js` — week-at-a-glance "route" chart replacing generic bars
- `BottomNav.js` — shared tab bar

**Screens**
- `LicenseScreen.js` — Whop license key entry, calls your proxy (see below)
- `OnboardingFlow.js` — 4-step setup, writes straight to SQLite settings/platforms
- `DashboardScreen.js` — live weekly gauge, tax/cap mini-gauges, route chart, platform mix, trip log — pull-to-refresh
- `LogEntryScreen.js` — income/expense entry, loads your actual selected platforms, writes to SQLite
- `ChartsScreen.js` — W/M/Y period toggle, weekly bars, real income-vs-expense breakdown by platform
- `TaxScreen.js` — real YTD tax set-aside gauge, quarterly estimate breakdown, mileage deduction using the 2026 IRS rate (72.5¢/mile), CSV export
- `SettingsScreen.js` — live profile/budget/tax values, tap any row to edit, CSV export, notification toggle

**App.js** wires the whole boot sequence and tab navigation together.

## Whop licensing — one setup step required

Whop's `validate_license` endpoint requires your **company API key** in the
request header. That key must never live inside the APK itself — anyone can
decompile a React Native app and pull strings out of it, which would expose
your Whop account. So licensing goes through a tiny serverless proxy instead:

1. Deploy `serverless/whop-verify.js` as a Vercel serverless function (or
   Cloudflare Worker — adapt the handler signature if so). It's stateless, so
   the free tier is plenty — no ongoing cost, unlike the Firestore setup you
   moved away from.
2. In your deployment's environment variables, set `WHOP_API_KEY` to your
   Whop company API key (Developer settings → Company API keys in your Whop
   dashboard).
3. Copy the deployed URL into `PROXY_URL` at the top of
   `src/services/whopLicense.js`.

Without this, `LicenseScreen` will fail to verify any key — that's the only
piece that needs an external deploy before this can ship.

## Before you publish

- **Test the license flow end-to-end** with a real Whop membership + license key once the proxy is deployed.
- **Icon set**: screens use `react-native-vector-icons/Feather`. Run through Expo's [vector icon setup](https://docs.expo.dev/guides/icons/) if you haven't linked this before.
- **App icon / splash image**: `app.json` has colors set but no actual icon/splash image files yet — add `./assets/icon.png` and `./assets/splash.png` and reference them in `app.json`.
- **Tax rate default**: onboarding defaults to 15.3% (federal self-employment rate) as a starting point — it's editable in onboarding and Settings, and the disclaimer in TaxScreen reminds users to verify with a professional.
- **Mileage rate**: hardcoded to the 2026 IRS rate (72.5¢/mile) in `TaxScreen.js` — the IRS updates this every January, so bump `IRS_MILEAGE_RATE_2026` (rename it too) when they announce the new one.

## Running it

```
npm install
npm start
```
Requires Expo Go on a device, or an Android emulator, to preview. For the
actual sellable APK, use `eas build -p android --profile production` once
you've set up an Expo Application Services account (free tier works for this).
