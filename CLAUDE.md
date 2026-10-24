# CLAUDE.md

## Repository Map

⚠️ **GitPrice uses TWO separate repositories. Do NOT mix them up.**

| Repo | URL | Contains | Deploy Target |
|------|-----|----------|---------------|
| **gitprice** | `kirollosd/gitprice` | Chrome extension, backend services (scraper, matcher), mobile app, DB migrations | Chrome Web Store, server infra |
| **gitprice-web** (this repo) | `kirollosd/gitprice-web` | Marketing/landing site (Next.js), privacy policy, terms of service | Vercel (`gitprice.com`, `www` redirects to apex) |

**Rule:** All web/marketing site code goes here. Extension/backend code goes in `gitprice`. Never add Chrome extension, scraper, or matcher code to this repo.

## Project Overview

**gitprice-web** — Marketing and landing page site for GitPrice. Next.js 15 (App Router) with TypeScript, deployed on Vercel. GitHub Pages is retired.

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

## Key Integrations

- **Tally form**: ID from `NEXT_PUBLIC_TALLY_FORM_ID`
- **API / Supabase**: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key only)
