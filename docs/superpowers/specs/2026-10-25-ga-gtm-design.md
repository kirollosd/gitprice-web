# GP-376: Google Tag Manager and GA4 on gitprice-web

Status: draft for owner approval · Linear: GP-376 (sub-issue of GP-262) · Repo: kirollosd/gitprice-web

## Intent

The owner wants Google's standard reporting for the website, in addition to what Heap already gives them:
- where visitors come from (search, social, referrals, and UTM-tagged campaigns);
- waitlist conversion;
- reports they can share with investors and partners;
- a base that Google Ads can attach to later;
- a better understanding of what visitors do on the page.

Tag Manager (GTM) is the delivery layer, so tags can change without a deploy. GTM is the plan for every surface; this ticket builds the website only.

## Decisions (owner)

- **IDs.** GTM container `GTM-PLZZJV54`. GA4 measurement ID `G-SM4YKS90F0`. Search Console is already registered for gitprice.com.
- **Loading.** GTM and GA4 load on every page view, before any consent choice.
- **Heap loading.** Heap stays in code and still loads only after Allow, as it does today.
- **Consent.** GA uses Consent Mode v2 and stays cookieless until Allow:
  - Before a choice, `analytics_storage` is `denied`.
  - Allow sets `analytics_storage` to `granted`.
  - Decline keeps it `denied`, and any existing `_ga*` cookies are deleted.
- **Ad consent.** `ad_storage`, `ad_user_data` and `ad_personalization` stay `denied` permanently. The site promises "no ads", and Ads linking is out of scope (see Non-goals).
- **Events.** Events go to both GA and Heap (Heap only once it's loaded):
  - waitlist submitted;
  - CTA and store-badge clicks;
  - section engagement and scroll depth;
  - language switch, menu open and outbound links.
- **Key event.** `waitlist_submit` is the GA key event (the conversion).
- **GTM config.** It lives as a container export JSON in this repo, and the owner imports it once.
- **Legal copy.** The cookie notice and privacy policy get updated EN and AR copy that names Google Analytics and Tag Manager. It ships with this ticket.
- **Docs.** Setup and the plan for other surfaces are written into the repos' docs.

## Goals

1. **Consent behaviour.**
   - A page view reaches GA4 for every visitor.
   - Before Allow, no `_ga*` cookie exists.
   - After Allow, GA cookies are set and Heap loads.
   - After Decline, no GA cookies exist.
2. **Event coverage.** Every event in the table below reaches GA (visible in GTM Preview and GA DebugView). It also reaches Heap when Heap is loaded.
3. **Waitlist conversion.**
   - The owner can see `waitlist_submit` by audience (shopper/seller) and by locale.
   - It's marked as a key event.
   - Traffic source and UTM attribution are visible in GA's standard acquisition reports.
4. **One-sitting setup.** A non-engineer can finish GTM and GA setup in one sitting from `docs/analytics/README.md`.

## Non-goals

- **Google Ads.** No conversion tag (AW-…) and no ad consent; that's a later ticket. When Ads starts, the ad consent signals, the cookie copy and the "no ads" claims all change together.
- **Other surfaces.** No tracking into the extension or the mobile app (website → install → active user), and no identity stitching. That's a follow-up ticket.
- **Extension and mobile builds.** Neither is built here; there's documentation only (below).
- **Server-side tagging.**
- **The Arabic Tally form** (audit P0-1, owner: "keep it for now").

## Anti-goals: this is a failure even if it "works"

- A `_ga`/`_gid` cookie, or a Heap request, happens before the visitor clicks Allow.
- Ad signals are granted, or the site's "no ads" claim stops being true.
- Preview deployments and local dev send data into the production GA property.
- An event carries personal data: email, form answers, or a full URL with query strings that might hold tokens. `/reset-password` and the checkout return carry tokens in the URL fragment or query.
- The site breaks, or Core Web Vitals regress, when GTM or GA is blocked by an ad blocker.

## Constraints

- **Stack.** Next.js app router, `[locale]` routes (`/`, `/ar`).
  - The existing consent plumbing: `lib/consent.ts` (`gp_consent` cookie, `gp:consent` event, `setConsent`) and `app/components/Analytics.tsx` (Vercel Analytics always on, Heap after Allow).
  - There's no CSP today.
- **No new npm dependencies.** Use the GTM snippet and `next/script`.
- **Configuration.** `NEXT_PUBLIC_GTM_ID` is optional in `lib/env.ts`. If it's absent, nothing loads. It's set **only** in the Vercel Production environment, so preview and dev never load GTM. GA's ID lives only in the GTM container, not in code.
- **Copy.** New copy keys are added in the monorepo `design-system/i18n/{en,ar}.json`:
  - with proper MSA Arabic;
  - with GitPrice-only branding;
  - with the key-count pin in `design-system/metrics` updated.
  
  Then sync them into the web repo with `scripts/sync-design.mjs`.
- **Parity, Heap and tests.** Existing parity, the Heap gating and the tests stay green.

## How it works (decided)

### Loading and consent

1. An inline script in `<head>`, ahead of GTM:
   - It creates `window.dataLayer` and a `gtag()` shim.
   - It calls `gtag('consent','default', {...all denied, wait_for_update: 500})`.
   - If the `gp_consent=allow` cookie is already present, it immediately calls `gtag('consent','update',{analytics_storage:'granted'})`, so returning visitors who already allowed count fully from the first hit.
2. The GTM snippet loads `afterInteractive` with `NEXT_PUBLIC_GTM_ID`, whatever the consent state.
3. `setConsent("allow")` pushes `consent update analytics_storage: granted`. Heap then loads as it does today.
4. `setConsent("decline")`:
   - It pushes `consent update analytics_storage: denied`.
   - It expires `_ga`, `_ga_*` and `_gid` on the host and its parent domains. Reuse and generalise `heapCookieExpiries` into a prefix-based helper rather than duplicating it.
   - The existing reload path then runs.
5. **GTM side.** The GA4 Google Tag fires on All Pages, with the built-in consent check `analytics_storage`. Consent Mode then handles cookieless pings automatically.
6. **Page views.** SPA page views come from GA4 enhanced measurement ("page changes based on browser history events"). The site sends no manual `page_view`.
7. **Redaction.** `page_location` is sent without its query string or fragment on `/reset-password`, `/checkout` and `/checkout/return`, and on `/welcome`, each with or without the `/ar` prefix:
   - A custom JavaScript variable, `Redacted Page Location`, strips `?…` and `#…` on those paths.
   - It's applied through one **Google Tag: Event Settings** variable, which sets `page_location`. That variable is attached to the Google Tag **and to every GA4 Event tag**, including `scroll_depth`, so no tag sends a raw URL.
   - Enhanced-measurement form interactions are disabled, because the Tally iframe is a separate document anyway.

### One event helper

- **`lib/track.ts`.** It exports `track(name, params)`:
  - It pushes `{event: name, ...params, locale}` to `window.dataLayer`.
  - It calls `window.heap?.track(name, params)` if Heap is loaded.
  - It never throws when either is missing (blocked).
  - Params are a closed, typed union per event, so nothing free-form can leak personal data.
- **Declarative clicks.** Click-type events are attached with `data-gp-track="<event>"` plus `data-gp-*` attributes on the elements. One delegated click listener, mounted once in the layout, reads them. There are no per-component handlers.

### Events

| event | params | source |
|---|---|---|
| `waitlist_submit` | `audience` (shopper\|seller), `placement` (hero\|bottom) | Tally `postMessage` from **this embed's own iframe**: `event.origin === "https://tally.so"`, `event.source === iframe.contentWindow`, and an event of `Tally.FormSubmitted`. There's one Tally form for both audiences. `audience` and `placement` are `TallyEmbed` props:<br>• `audience` comes from audit fix P0-2 (task 16, on `gp-262-web-build`). This branch rebases onto it before the build starts.<br>• `placement` is new here.<br>Never forward the payload's answers. |
| `cta_click` | `cta_id`, `placement` (nav\|hero\|bottom\|menu\|footer) | `data-gp-track` on the waitlist/primary CTAs, "For sellers"/"For shoppers" and the anchor links |
| `store_click` | `store` (chrome\|app_store\|play), `placement` | the store badges (launch mode) |
| `section_view` | `section_id` | IntersectionObserver at 50% visible, once per section per page view, on the Home and Sellers top-level sections (hero, baseline, features rows, groups, privacy, faq, bottom CTA) |
| `scroll_depth` | `percent` (25/50/75/90) | GTM's built-in scroll-depth trigger (GA only; Heap autocaptures scrolling) |
| `locale_switch` | `from`, `to` | the language switch: the header and footer, plus the minimal nav on the hosted pages (`/welcome`, `/reset-password`, `/checkout*`), which share `[locale]/layout.tsx` |
| `menu_open` | none | the mobile menu opening |
| outbound clicks | none | GA4 enhanced measurement, plus Heap autocapture. No code. |

`locale` is added to every event automatically.

### GTM container (in repo)

`docs/analytics/gtm-container.json` is a GTM export (`exportFormatVersion: 2`). It contains:
- **Tags:**
  - the GA4 Google Tag (`G-SM4YKS90F0`, with the redacted `page_location`);
  - one GA4 Event tag per custom event above, with its params as event parameters.
- **Triggers:**
  - custom-event triggers for each event;
  - All Pages;
  - Scroll Depth (25/50/75/90).
- **Variables:** dataLayer variables for every param, plus `locale` and the redaction variable.

The owner imports it into a workspace with **Merge → Rename conflicting** and publishes. The container JSON is the source of truth; edits made in the GTM UI are exported back into the repo.

## Docs to write

- **`gitprice-web/docs/analytics/README.md`**, the owner's walkthrough:
  - **GTM setup:**
    1. Open container GTM-PLZZJV54.
    2. Admin → Import Container → choose `gtm-container.json`, workspace Default, Merge → Rename.
    3. Preview against gitprice.com.
    4. Publish.
  - **GA4 settings:**
    - Admin → Events → mark `waitlist_submit` as a key event once it has fired.
    - Register the custom dimensions `audience`, `placement`, `cta_id`, `section_id`, `store` and `locale` (event scope).
    - Enhanced measurement:
      - keep page views (including browser-history changes) and outbound clicks;
      - turn **off** scrolls, because the GTM scroll-depth trigger replaces them and leaving both on would double-count at 90%;
      - turn **off** form interactions.
    - Set data retention to 14 months.
    - Link Search Console (Admin → Product links).
  - **Vercel:** set `NEXT_PUBLIC_GTM_ID=GTM-PLZZJV54` in Production only, then redeploy.
  - **Verify:** run the consent checklist from Goal 1 in a fresh profile.
- **`gitprice-web/docs/analytics/events.md`**: the event table above, as the contract for anyone adding events.
- **Monorepo `docs/analytics/tag-management.md`**, the cross-surface plan (written only, built later):
  - **Website:** web GTM (this ticket).
  - **Chrome extension:** Manifest V3 forbids remote code, so no GTM or gtag.js. Events go server-side through the **GA4 Measurement Protocol**, either via our API (which holds the API secret) or with an extension-only data stream, gated by the existing Settings → Privacy → "Share usage analytics" toggle.
  - **Mobile:** Firebase Analytics with GTM for Firebase containers (iOS and Android), gated by the same in-app toggle.
  - **Shared rules:** one event naming contract across surfaces (`snake_case`, same param names), no personal data, and consent first.

## Legal copy (new keys, EN and AR; owner to approve wording)

**`web.component.webCookieNotice.default.body`** (replaces the current value)
- **EN:** "This site uses analytics cookies from Google Analytics and Heap to understand how it's used. No ads, and we never sell your data."
- **AR:** "يستخدم هذا الموقع ملفات تعريف ارتباط للتحليلات من Google Analytics وHeap لفهم طريقة استخدامه. لا إعلانات، ولا نبيع بياناتك."

**`web.privacy.section7.p4`** (new)
- **EN:** "This website also uses Google Tag Manager and Google Analytics to measure visits and where they come from. Until you make a choice in the cookie notice, Google Analytics runs without cookies and receives only anonymous signals. If you allow cookies, Google Analytics sets its own cookies to recognise returning visits; if you decline, it sets none. We do not use this data for advertising."
- **AR:** "يستخدم هذا الموقع أيضًا Google Tag Manager وGoogle Analytics لقياس الزيارات ومعرفة مصادرها. وإلى أن تحدد اختيارك في إشعار ملفات تعريف الارتباط، يعمل Google Analytics دون ملفات تعريف ارتباط ولا يتلقى سوى إشارات مجهولة الهوية. وإذا سمحت بملفات تعريف الارتباط، يضع Google Analytics ملفاته الخاصة للتعرّف على الزيارات المتكررة، وإذا رفضت فلن يضع أيًّا منها. ولا نستخدم هذه البيانات في الإعلانات."

**`web.privacy.meta`**: the "Last updated" date becomes the ship date, with the effective date unchanged.

## Left to the builder

- The exact `cta_id` values. Use short `snake_case` names that reflect the element's role, listed in `events.md`.
- Section ids for `section_view`: reuse the existing anchor ids where they exist, and add stable ids where they're missing.
- Where the delegated listener and the IntersectionObserver are mounted. Mount each once; keep them client-only.
- The test approach:
  - unit tests for `track()`, the consent `gtag` calls, cookie expiry and the Tally message filter;
  - a Playwright check against a local build with a fake GTM ID: GTM requested, no `_ga` cookie before Allow, the consent update after Allow, and `dataLayer` receiving `cta_click` and `section_view`.

## My calls (flag if wrong)

- Ad consent signals stay denied permanently, until an Ads ticket exists.
- GTM is loaded only in Vercel Production, through the env var.
- Scroll depth goes to GA only. Heap already autocaptures.
- `page_location` is redacted on the token-bearing routes.
- The container JSON in the repo is the source of truth.
