# Plan: GP-933 + GP-935 get landing + pixels

docs/superpowers/plans/2026-11-27-gp-933-935-get-landing-pixels.md

Worktree: `.worktrees/gp-933-935-get-pixels` branch `gp-933-935-get-pixels`.
One PR cites leaf tickets GP-933 and GP-935 only.

## Task 1 — UTM helpers (TDD)

- [x] RED: `tests/utm.test.ts` — parse searchParams; append convention fields;
      preserve unknown UTMs; build CWS URL from `env.chromeStoreUrl`.
- [x] GREEN: `lib/utm.ts` (`parseUtms`, `withUtms`, `chromeStoreUrlWithUtms`).

## Task 2 — Device detection (TDD)

- [x] RED: `tests/device.test.ts` — phone vs desktop from UA + optional hints.
- [x] GREEN: `lib/device.ts` (`isPhoneUserAgent`).

## Task 3 — Send-to-desktop API (TDD)

- [x] Add `resend` dependency.
- [x] RED: `tests/send-to-desktop-api.test.ts` — invalid email 400; honeypot
      204; missing RESEND 503; success 200 (mock Resend); rate limit 429.
- [x] GREEN: `app/api/send-to-desktop/route.ts` — validate, rate-limit
      (in-memory IP bucket ok for v1), Resend template with CWS+UTM link,
      never log email. Server env: `RESEND_API_KEY`, `RESEND_FROM`.

## Task 4 — Get page UI (TDD + design)

- [x] Add `web.get.*` i18n (monorepo design-system + sync, or documented
      temporary keys in web `i18n` with follow-up).
- [x] RED: `tests/get-page.test.tsx` — desktop shows CWS link with UTMs;
      phone shows form; form posts to `/api/send-to-desktop`.
- [x] GREEN: `app/[locale]/get/page.tsx` + `GetLanding` client component + CSS
      module. Coral tokens. Run /impeccable, taste-skill, ui-ux-pro-max;
      screenshots in PR body.
- [x] Wire track events: extend `lib/track.ts` with `send_to_desktop` and
      ensure `store_click` / cws still fire from the get CTA.

## Task 5 — Consent-gated pixels + CAPI (TDD)

- [x] RED: `tests/ad-pixels.test.tsx` — no scripts when consent decline/null;
      scripts when allow; PageView once; CWS click and send_to_desktop push
      Meta/TikTok when present.
- [x] GREEN: `lib/ad-pixels.ts` + wire into `Analytics.tsx` (or dedicated
      client). Env: `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_TIKTOK_PIXEL_ID`.
- [x] RED/GREEN: CAPI helper called from send-to-desktop route only when
      consent cookie Allow (or explicit `consent=allow` body flag from client
      that already checked); `META_CAPI_ACCESS_TOKEN` server-only.
- [x] Update `.env.example` + CLAUDE.md env table (names only).

## Task 6 — DoD

- [x] `npm test`, `npm run lint`, `npm run build` green in worktree.
- [ ] typescript-reviewer + code-reviewer once; security-reviewer (user input,
      email, rate limit, secrets). *(parent: ship PR + review)*
- [ ] Push PR to `kirollosd/gitprice-web`; Linear In Review + Documents
      re-synced; comment evidence. *(parent ships PR)*
- [x] List owner-only Vercel env steps; do not set prod secrets.
