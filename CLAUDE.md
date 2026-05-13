# CLAUDE.md

## Repository Map

⚠️ **GitPrice uses TWO separate repositories. Do NOT mix them up.**

| Repo | URL | Contains | Deploy Target |
|------|-----|----------|---------------|
| **gitprice** | `kirollosd/gitprice` | Chrome extension, backend services (scraper, matcher), mobile app, DB migrations | Chrome Web Store, server infra |
| **gitprice-web** (this repo) | `kirollosd/gitprice-web` | Marketing/landing site (Next.js), privacy policy, terms of service | GitHub Pages (`kirollosd.github.io/gitprice-web`) |

**Rule:** All web/marketing site code goes here. Extension/backend code goes in `gitprice`. Never add Chrome extension, scraper, or matcher code to this repo.

## Project Overview

**gitprice-web** — Marketing and landing page site for GitPrice. Next.js 15 (App Router) with TypeScript, statically exported to GitHub Pages.

## Architecture

```
gitprice-web/
├── app/
│   ├── layout.tsx              # Root layout: nav, footer, fonts, metadata
│   ├── page.tsx                # Landing page (hero, features, how-it-works, waitlist)
│   ├── globals.css             # Design system tokens, font-face, shared styles
│   ├── privacy/page.tsx        # Privacy Policy
│   ├── terms/page.tsx          # Terms of Service
│   └── components/
│       ├── Nav.tsx             # Top navigation (server component)
│       ├── MobileNav.tsx       # Hamburger menu ('use client')
│       ├── Footer.tsx          # Site footer
│       ├── Logo.tsx            # SVG logo (icon + wordmark variants)
│       ├── HeroMockup.tsx      # Browser chrome mockup (server component)
│       ├── StoreChip.tsx       # Store badge (Amazon.eg, Noon, Jumia)
│       ├── ScrollReveal.tsx    # IntersectionObserver animation ('use client')
│       └── TallyButton.tsx     # Tally waitlist form trigger ('use client')
├── public/
│   ├── fonts/                  # Self-hosted: Sora (display) + Karla (body) woff2
│   ├── logo_full.svg           # Full wordmark
│   └── logo_icon.svg           # Icon-only mark
├── next.config.ts              # Static export, basePath for GitHub Pages
└── package.json
```

## Design System

- **Fonts:** Sora (headings), Karla (body) — self-hosted woff2, NO Google Fonts CDN
- **Colors:** Apple-inspired grays + emerald green accent (`#34d399`)
- **Tokens:** CSS custom properties in `globals.css`
- **Style:** Apple-aesthetic, frosted glass nav, dark waitlist section

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # Static export to out/
```

## Deployment

GitHub Pages via GitHub Actions. Static export with:
- `output: 'export'`
- `basePath: '/gitprice-web'` (production only)
- `trailingSlash: true`

## Key Integrations

- **Tally form** (ID: `ODdMyk`) — waitlist signup, loaded via `next/script`
- **No backend/API** — pure static marketing site
