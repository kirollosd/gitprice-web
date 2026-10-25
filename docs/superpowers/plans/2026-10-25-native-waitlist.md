# Native Waitlist Form (GP-389) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Tally iframe with a native waitlist form that matches the Web.sketch waitlist boards exactly, backed by a new Go API endpoint.

**Architecture:** The web form posts JSON to `POST {NEXT_PUBLIC_API_BASE_URL}/api/v1/waitlist` on the Go API (`services/scraper`, chi router, Railway). The API validates the request, rate-limits per IP and stores one row per email in Postgres. The form renders the board states (empty, submitting, joined, alreadyJoined, error, failed) from existing i18n keys under `web.component.webWaitlistForm.*`.

**Tech Stack:** Go 1.x, chi, pgx, golang-migrate (`db/migrations`), Next.js 16 App Router, React 19, vitest, Playwright.

**Spec:** Owner decision 2026-10-25 (AskUserQuestion): "Native form → Go API". Linear GP-389. The design source is `design/sketch/GitPrice — Web.sketch`, the Home and Sellers `prelaunch*` boards. Their copy is in `design-system/i18n/{en,ar}.json` under `web.component.webWaitlistForm`.

## Global Constraints

- Arabic copy is proper MSA, never Egyptian. Use الموديل, never الطراز.
- Branding is GitPrice only. Don't name a region or a specific store.
- No secrets in code, commits or tickets. Never read `.env` files.
- Worktrees:
  - monorepo `/Users/kirollos/Documents/gitprice/.worktrees/gp-389-waitlist-api` (branch `gp-389-waitlist-api`);
  - web `/Users/kirollos/Documents/gitprice-web/.worktrees/gp-389-native-waitlist` (branch `gp-389-native-waitlist`).
- Commits are conventional and carry no attribution trailer. Don't push or merge; the controller does that.
- Monorepo i18n changes need a matching key-count pin in `design-system/metrics/i18n.test.mjs` (`node --test design-system/metrics/*.test.mjs`).
- Web copy is synced, never hand-edited: `node scripts/sync-design.mjs <monorepo worktree>`.

## API contract (both tasks build against this exactly)

`POST /api/v1/waitlist`, `Content-Type: application/json`. No auth.

Request body:

```json
{ "email": "name@example.com", "audience": "shopper", "locale": "en", "website": "" }
```

- `email`: required. Trimmed. At most 254 chars. It must have exactly one `@`, a non-empty local part, and a domain containing a dot that doesn't start or end with one. Uniqueness compares the lowercased value.
- `audience`: `"shopper"` or `"seller"`.
- `locale`: `"en"` or `"ar"`.
- `website`: a honeypot field, a hidden text input on the form. If it's non-empty, respond 201 `{"status":"joined"}` and store nothing.
- Unknown fields are ignored. Bodies over 4 KB are rejected (413, or 400 via `MaxBytesReader`).

Responses (`{"error": CODE}` follows the API's existing error envelope):

| Case | Status | Body |
|---|---|---|
| New email stored | 201 | `{"status":"joined"}` |
| Email already present (any audience) | 200 | `{"status":"already_joined"}` |
| Bad JSON, email, audience or locale | 400 | `{"error":"INVALID_EMAIL"}` for an email problem, `{"error":"INVALID_REQUEST"}` otherwise |
| Rate limited | 429 | existing limiter body |
| DB down | 503 | `{"error":"UNAVAILABLE"}`; the DB error is logged, never returned |

Rate limit: `middleware.PerFeatureRateLimit(deps.RateLimit, "waitlist", 10, time.Hour, trustedProxies...)`. CORS uses the existing middleware and the `CORS_ALLOWED_ORIGINS` env var. `https://gitprice.com` must be allowed in production; the controller checks Railway.

---

### Task 1 (monorepo): waitlist table, endpoint, privacy copy

**Files:**
- Create: `db/migrations/052_waitlist.up.sql`, `db/migrations/052_waitlist.down.sql`. Check that 052 is the next free number on this branch; use the next free one if it isn't.
- Create: `services/scraper/internal/api/handlers/waitlist.go` and `waitlist_test.go`.
- Modify: `services/scraper/internal/apiserver/router.go` (route), `services/scraper/cmd/api/main.go` (wiring, only if needed).
- Modify: `design-system/i18n/en.json` and `ar.json` (privacy copy), and `design-system/metrics/i18n.test.mjs` (pin, only if the key count changes).
- Modify: `docs/claude/key-design-decisions.md` (one bullet: Waitlist (GP-389)).

**Interfaces:**
- Produces: the API contract above.

Steps:
- [ ] Migration up:
  - `waitlist(id bigserial primary key, email text not null, email_lower text not null unique, audience text not null check (audience in ('shopper','seller')), locale text not null check (locale in ('en','ar')), created_at timestamptz not null default now())`.
  - RLS enabled with no policies, matching how other server-only tables in `db/migrations` handle RLS; follow the newest migration's pattern.
  - The down migration drops the table.
- [ ] Failing handler tests (table-driven, using the package's existing DB-or-fake pattern):
  - 201 new;
  - 200 duplicate in different case (`Name@Example.com` after `name@example.com`);
  - 400 `INVALID_EMAIL` for `sara@example`, an empty value and a 255-char value;
  - 400 `INVALID_REQUEST` for `audience:"x"` and for bad JSON;
  - honeypot gives 201 with no row;
  - a DB error gives 503 whose body doesn't contain the error text.
- [ ] Implement the handler with `INSERT ... ON CONFLICT (email_lower) DO NOTHING RETURNING id`: no row means `already_joined`. Register `r.With(middleware.PerFeatureRateLimit(...)).Post("/waitlist", ...)` inside `/api/v1`.
- [ ] Privacy copy. Find the web privacy paragraph that names Tally (`git grep -n Tally design-system/i18n`). Rewrite it in EN and MSA AR, in the same style and length:
  - waitlist emails are collected by GitPrice's own form and stored on GitPrice's servers, used only for the launch email, with removal on request;
  - Tally is no longer mentioned anywhere;
  - keep every other sentence unchanged.
  Put the exact before and after text in the report, because the owner will review the legal copy.
- [ ] Run `cd services/scraper && go test ./internal/api/... ./internal/apiserver/...` and `go vet ./...`. Run the integration test against the local postgres container if the package has DB-backed tests (`make up` / `make migrate`; the container is `gp-262-web-spec-postgres-1`, or start one through `docker compose`). Run the metrics tests.
- [ ] Commit `feat(api): waitlist endpoint and table (GP-389)`, then `feat(i18n): privacy copy for the native waitlist form (GP-389)`.

### Task 2 (web): native WaitlistForm replaces TallyEmbed

**Files:**
- Create: `app/components/WaitlistForm.tsx`, `app/components/WaitlistForm.module.css`, `tests/waitlist-form.test.tsx`.
- Delete: `app/components/TallyEmbed.tsx`, `TallyEmbed.module.css`, `tests/tally.test.tsx`.
- Modify: `app/components/HomeSections.tsx` (the `Waitlist` wrapper renders `WaitlistForm`), `lib/env.ts` (drop `tallyFormId` and `NEXT_PUBLIC_TALLY_FORM_ID` from the required set), `tests/env.test.ts`, `tests/home-sections.test.tsx`, `tests/sellers-nav.test.tsx`, `e2e/home.spec.ts`, `e2e/parity-lib.ts` and `e2e/parity.spec.ts` (remove the Tally stub and mask; stub `**/api/v1/waitlist` instead), `.env.example`, `.github/workflows/ci.yml` (drop the Tally env), `docs/analytics/events.md` and `README` (only if they mention Tally).

**Interfaces:**
- Consumes: the API contract above, and `env.apiBaseUrl`.
- Produces: `WaitlistForm({ locale, audience, placement, label? })`. The `Waitlist` wrapper signature in HomeSections is unchanged.

Behaviour (board-exact; read the Sketch boards for spacing, sizes and colours, and use tokens from `styles/tokens.css` only):
- **empty:**
  - a visible label `empty.input.email.label`;
  - `<input type="email" name="email" autocomplete="email" inputmode="email" dir="ltr" required>` with the placeholder `empty.input.email.placeholder`. the controller already added it in monorepo 7766c126 (`you@example.com` in both locales, as on the boards). Sync it first with `node scripts/sync-design.mjs /Users/kirollos/Documents/gitprice/.worktrees/gp-389-waitlist-api`;
  - a full-width pill submit button with `empty.button.submit.label`, or the `label` prop when given;
  - a note `empty.note`;
  - a visually hidden honeypot `website` input (`tabIndex={-1}`, `autocomplete="off"`, `aria-hidden`).
- **error:** client-side validation uses the same email rule as the API and runs on submit. Show `error.input.email.message` under the field (`aria-describedby`, `aria-invalid`) and focus the field. The API's 400 `INVALID_EMAIL` shows the same message.
- **submitting:** the button shows `submitting.button.submit.label`, the form is `aria-busy`, and the button is disabled.
- **joined** (201) and **alreadyJoined** (200): the form is replaced by the title and body from the board. Focus moves to the title (`tabIndex=-1`). Fire `track("waitlist_submit", { audience, placement })` on both.
- **failed** (network error, 429 or 5xx): `failed.message` in an alert region, and the button shows `failed.button.submit.label`. Resubmitting retries.
- Use `fetch` with a 10 s `AbortSignal.timeout`. Never log the email. RTL and dark mode come from the tokens.
- Tests:
  - every state renders its exact i18n copy (EN and AR);
  - the validation rule matches the API's cases;
  - 201 and 200 each fire `waitlist_submit` once;
  - 429 and 500 show failed;
  - the honeypot is sent;
  - no request is made on invalid input.
- E2E: the hero and bottom forms submit against a stubbed `/api/v1/waitlist` (201, then 200), and the invalid case shows the error. Parity screens for the form states compare against the `Home-prelaunch-{submitting,joined,error,failed}` refs with no mask.
- [ ] Commit `feat: GP-389 native waitlist form replaces Tally`.

## Review Focus

1. A duplicate email in a different case must answer `already_joined`, not 500 or a second row.
2. Double-submitting by clicking twice quickly must send one request; the button is disabled while submitting.
3. If the API is unreachable, the failed state is reachable and keeps the typed email.
4. In AR, the email input stays LTR while its label and messages are RTL.
5. The honeypot must never store a row, and the response must look identical to a real join.
