# CLAUDE.md

## Repository Map

⚠️ **GitPrice uses TWO separate repositories. Do NOT mix them up.**

| Repo | URL | Contains | Deploy Target |
|------|-----|----------|---------------|
| **gitprice** | `kirollosd/gitprice` | Chrome extension, backend services (scraper, matcher), mobile app, DB migrations | Chrome Web Store, server infra |
| **gitprice-web** (this repo) | `kirollosd/gitprice-web` | Marketing/landing site (Next.js), privacy policy, terms of service | Vercel (`gitprice.com`, `www` redirects to apex) |

**Rule:** All web/marketing site code goes here. Extension/backend code goes in `gitprice`. Never add Chrome extension, scraper, or matcher code to this repo.

## Project Overview

**gitprice-web** — Marketing and landing page site for GitPrice. Next.js 15 (App Router) with TypeScript, deployed on Vercel.

## Architecture

```
gitprice-web/
├── app/                  # App Router pages, layout, globals.css, components/
├── lib/env.ts            # Typed, validated NEXT_PUBLIC_* config (build fails if required vars missing)
├── lib/i18n.ts           # t(locale, 'web.…'), dir(); throws on missing key
├── i18n/{en,ar}.json     # GENERATED copy of web.* strings. Do not hand-edit
├── styles/tokens.css     # GENERATED design tokens. Do not hand-edit
├── scripts/sync-design.mjs  # node scripts/sync-design.mjs <path-to-gitprice-monorepo>
├── public/fonts/         # Self-hosted Fustat + Noto Sans Arabic woff2 (no CDN)
├── tests/                # vitest
└── vercel.json           # www -> apex redirect
```

## Design System

- **Source of truth:** the gitprice monorepo (`design-system/`). Run `npm run sync -- <monorepoPath>` to refresh tokens and copy.
- **Fonts:** Fustat (Latin) + Noto Sans Arabic, self-hosted. Light/dark follows `prefers-color-scheme` via `data-gp="app"`.
- **Copy:** pages read strings only through `t()`; Arabic comes from the synced `ar.json`.

## Development

```bash
npm install
cp .env.example .env.local   # placeholders; real values live in Vercel
npm run dev     # http://localhost:3000
npm test        # vitest
npm run build
```

## Deployment

Vercel, on `gitprice.com`. Flipping prelaunch to launch means changing `NEXT_PUBLIC_LAUNCH` and the store URLs in Vercel and redeploying. If `LAUNCH=1` and a store URL is missing, the build fails.

## Environment variables

Names only. Real values live in Vercel (Production and Preview); `.env.example` holds placeholders. `lib/env.ts` validates them and fails the build when a required one is missing.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_LAUNCH` | `0` prelaunch (waitlist), `1` launch (store buttons). With `1`, a missing store URL fails the build. |
| `NEXT_PUBLIC_CHROME_STORE_URL` | Chrome Web Store listing (required when launched) |
| `NEXT_PUBLIC_APP_STORE_URL` | App Store listing (required when launched) |
| `NEXT_PUBLIC_PLAY_STORE_URL` | Google Play listing (required when launched) |
| `NEXT_PUBLIC_TALLY_FORM_ID` | Tally waitlist form |
| `NEXT_PUBLIC_API_BASE_URL` | GitPrice API, used by checkout |
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

## Key Integrations

- **Tally form**: ID from `NEXT_PUBLIC_TALLY_FORM_ID`
- **API / Supabase**: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key only)
