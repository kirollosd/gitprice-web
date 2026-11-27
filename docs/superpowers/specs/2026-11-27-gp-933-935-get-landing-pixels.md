# GP-933 + GP-935: `/get` landing + consent-gated ad pixels

docs/superpowers/specs/2026-11-27-gp-933-935-get-landing-pixels.md

## Context

Paid Black Friday traffic lands on phones; the Chrome extension needs desktop.
Today every width shows "Add to Chrome" (`StoreBadges`, `MOBILE_APPS_ENABLED =
false`). There is no Meta/TikTok pixel — only Vercel Analytics, SpeedInsights,
and Heap after consent.

Tickets ship together in one PR (per GP-935). Repo: `gitprice-web`.

## Goals

1. **GP-933** — Locale get page: Arabic primary at `/ar/get`, English mirror at
   `/get` (middleware strips `/en` → rewrite under `[locale]`).
2. **GP-935** — Meta Pixel + CAPI and TikTok Pixel load only after consent
   Allow; fire page view, CWS click, send-to-desktop submit; carry UTMs into
   the CWS link.

## Acceptance criteria

### Get page (GP-933)

- [ ] `app/[locale]/get/page.tsx` exists; `/ar/get` and `/get` render.
- [ ] Device detection (UA + coarse pointer / max-width fallback): phone →
      send-to-desktop email form; desktop → CWS CTA with UTMs preserved.
- [ ] Form validates email client-side (reuse Waitlist `isValidEmail` rules).
- [ ] `POST /api/send-to-desktop` emails the CWS URL (with UTMs) via Resend;
      rate-limited; honeypot; never logs the email; returns generic errors.
- [ ] MSA copy, calm voice, no hype / no `!`. Coral (GP-407). Impeccable +
      taste-skill + ui-ux-pro-max before/after with screenshots.
- [ ] i18n via `t()` — add `web.get.*` (+ form) keys in monorepo
      `design-system/i18n` and sync, or document temporary web-side keys with
      sync follow-up.

### Pixels + UTM (GP-935)

- [ ] Meta Pixel + TikTok Pixel scripts load only when consent is `allow`
      (same pattern as Heap in `Analytics.tsx` / `lib/consent.ts`).
- [ ] Server-side Meta CAPI for send-to-desktop (and optionally CWS click when
      a server hop exists); token only in server env.
- [ ] Events: `PageView` / page view; `cws_click` (desktop); `send_to_desktop`
      (phone submit success).
- [ ] UTM convention documented and enforced on outbound CWS links:
      `utm_source={ig|tt|fb}&utm_medium={organic|paid}&utm_campaign={bf26|always_on|ramadan27}&utm_content={creative_id}`
      plus passthrough of unknown incoming UTMs.
- [ ] Env only: `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`,
      `NEXT_PUBLIC_TIKTOK_PIXEL_ID`, `RESEND_API_KEY`, `RESEND_FROM`. No secrets
      in client bundles except public pixel IDs.

## Edge cases

- Missing Resend/pixel env → page still works; email endpoint 503; pixels no-op.
- Consent decline → no Meta/TikTok scripts, no CAPI from client triggers that
  require pixel; server CAPI for email may still fire as first-party conversion
  (document choice: fire CAPI on successful send without ads cookies, using
  hashed email only when consent allow — default **CAPI only when consent
  allow** to stay conservative).
- Bot / honeypot filled → 204 no-op.
- Rate limit exceeded → 429.
- Desktop UA spoofed on phone → form still available via explicit "email me
  the link" secondary control.

## Out of scope

- GP-934 creatives, GP-936 campaign go-live (owner budget).
- Changing home dock / StoreBadges globally (get page is the ad landing).
- GP-929 backlog duplicate (superseded by GP-935 for cycle 45).

## Owner-only (do not block code PR)

- Vercel: set Resend + Meta + TikTok env for Production/Preview.
- Approve Meta/TikTok pixel IDs and CAPI token creation in Business Manager.
