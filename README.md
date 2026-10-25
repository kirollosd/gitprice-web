# gitprice-web

Marketing site for GitPrice. Next.js 15 (App Router), deployed on Vercel at gitprice.com.

```bash
npm install
cp .env.example .env.local
npm run dev
npm test
```

Design tokens and copy are synced from the gitprice monorepo: `npm run sync -- <monorepoPath>`. See CLAUDE.md.

## Environment variables

Names only. Real values live in Vercel (Production and Preview); `.env.example` holds placeholders. `lib/env.ts` validates them and fails the build when a required one is missing.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_LAUNCH` | `0` prelaunch (waitlist), `1` launch (store buttons). With `1`, a missing store URL fails the build. |
| `NEXT_PUBLIC_CHECKOUT` | `0` (default) `/checkout` and `/checkout/return` return 404 until Pro opens; `1` serves them. The e2e prelaunch build sets `1`, the launch build leaves it off. |
| `NEXT_PUBLIC_SELLERS_NAV` | `0` (default) hides the header "For sellers" / "For shoppers" toggle in the desktop nav and the menu sheet; `1` shows it. `/sellers` stays reachable either way. The e2e builds set `1` (the boards draw it). |
| `NEXT_PUBLIC_CHROME_STORE_URL` | Chrome Web Store listing (required when launched) |
| `NEXT_PUBLIC_APP_STORE_URL` | App Store listing (required when launched) |
| `NEXT_PUBLIC_PLAY_STORE_URL` | Google Play listing (required when launched) |
| `NEXT_PUBLIC_API_BASE_URL` | GitPrice API, used by checkout and the waitlist form (`POST /api/v1/waitlist`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project, used by reset password |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable key only |
| `NEXT_PUBLIC_HEAP_ID` | Optional. Heap analytics, loaded only after consent |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata and sitemap |

## Syncing the design system

Tokens (`styles/tokens.css`) and copy (`i18n/*.json`) are generated from the gitprice monorepo. Never hand-edit them.

```bash
node scripts/sync-design.mjs <path-to-gitprice-monorepo>
# or
npm run sync -- <path-to-gitprice-monorepo>
```

## Tests

```bash
npm test                              # vitest
npx playwright test                   # all projects: prelaunch (:3000) and launch (:3001), both built and started by the config
SKIP_PARITY=1 npx playwright test     # functional and layout specs only (what CI runs)
npx playwright test --project=launch  # one project
npx tsc --noEmit --incremental false
npm run lint
```

Free ports 3000 and 3001 first. `PLAYWRIGHT_BASE_URL=<url>` runs the suite against a deployed preview instead of local builds (set `VERCEL_BYPASS_SECRET` if Deployment Protection is on: `e2e/global-setup.ts` trades it for a cookie on that origin only; pick the project matching the deployment's `NEXT_PUBLIC_LAUNCH`).

### Visual parity

`e2e/parity*.spec.ts` compare each screen with the design board PNGs in `e2e/refs/`, named `<Screen>-<state>-<width>-<locale>-<theme>.png`. Each test has a diff tolerance with a written reason; Home and Sellers are `test.fixme` with the measured divergence in `e2e/parity-lib.ts`.

- `PARITY_MEASURE=1 npx playwright test parity` records ratios to `test-results/parity-ratios.jsonl` instead of asserting.
- To update baselines, export the boards again from the Sketch library and replace the PNGs in `e2e/refs/`, keeping the names. Do not use `--update-snapshots`: the assertions read masked copies in `e2e/.parity/` (gitignored), so it never touches `refs/`. Then re-measure and adjust tolerances.
- Refs come from macOS/Sketch rendering, so parity runs against the Vercel preview, not in the PR job.

## CI

- `.github/workflows/ci.yml` (pull requests): lint, typecheck, vitest, build, then the functional Playwright suite (`SKIP_PARITY=1`).
- `.github/workflows/preview.yml` (`deployment_status`, successful Vercel Preview deployments only, never Production): Lighthouse budgets (`lighthouserc.json`; `npm run lighthouse` starts the local server, CI passes `--collect.url` instead) plus a non-blocking Playwright parity and layout step against `deployment_status.target_url`. Optional secret `VERCEL_AUTOMATION_BYPASS_SECRET` and variable `SITE_MODE` (`prelaunch` or `launch`, default `prelaunch`).
