# Analytics setup: Google Tag Manager and GA4

This is the owner's one-sitting setup for gitprice.com. You need edit access to:
- GTM container `GTM-PLZZJV54`;
- GA4 property `G-SM4YKS90F0`;
- the Vercel project.

## How it works

- **Loading.** Every page loads GTM, before any cookie choice.
  - GTM loads only when `NEXT_PUBLIC_GTM_ID` is set, and only in Production, so previews and local dev send nothing to Google.
  - The GA4 ID lives only in `gtm-container.json`, never in the site's code.
- **Consent (Consent Mode v2).**
  - Before a choice, every consent signal is `denied`. GA runs cookieless and receives only anonymous pings.
  - **Allow** grants `analytics_storage` only. GA then sets its cookies, and Heap loads.
  - **Decline** keeps it `denied` and deletes any `_ga`, `_ga_*` and `_gid` cookies.
  - The ad signals (`ad_storage`, `ad_user_data`, `ad_personalization`) are never granted. The site promises no ads.
- **Events.** The site pushes `{event, ...params, locale}` to `window.dataLayer`. GTM turns each push into a GA4 event. Heap also gets the event once it's loaded.
- **Redaction.** On `/reset-password`, `/checkout`, `/checkout/return` and `/welcome` (each with or without `/ar`), `page_location` is sent without its query string or fragment, because those URLs can carry tokens.
  - The `Redacted Page Location` variable does this.
  - It reaches every GA tag through the `GA4 Event Settings` variable.
- **Page views.**
  - The Google Tag sends the first page view of each visit.
  - In-app navigation (the site is a single-page app) fires GTM's **History Change** trigger. That trigger sends a `page_view` through the **GA4 Event - page_view** tag.
  - The trigger ignores `replaceState`, because Next.js calls it on load and on internal URL updates that aren't page changes. Only `pushState` (a link click) and `popstate` (Back/Forward) count.
  - That tag recomputes the redacted `page_location` on every fire. GA4's own "browser history" page views would reuse the URL captured when the page first loaded, which can be stale or unredacted, so that setting is turned off (step 3).
  - The site's code sends no `page_view`.
- **Source of truth.** `gtm-container.json` in this folder is the source of truth. If you change anything in the GTM UI, export the container and commit it back here.

### Events

`locale` is sent with every event.

| Event | Params | When it fires |
|---|---|---|
| `waitlist_submit` | `audience` (shopper / seller), `placement` (hero / bottom) | A visitor submits the waitlist form. **This is the key event (conversion).** |
| `cta_click` | `cta_id`, `placement` (nav / hero / bottom / menu / footer) | A visitor clicks a waitlist or primary CTA, "For sellers" / "For shoppers", or an anchor link. |
| `store_click` | `store` (chrome / app_store / play), `placement` | A visitor clicks a store badge (launch mode). |
| `section_view` | `section_id` | A top-level section on Home or Sellers is at least 50% visible. Fires once per section per page view. |
| `scroll_depth` | `percent` (25 / 50 / 75 / 90) | GTM's scroll-depth trigger. GA only; Heap autocaptures scrolling. |
| `locale_switch` | `from`, `to` | A visitor uses the language switch. |
| `menu_open` | none | A visitor opens the mobile menu. |
| `page_view` | none | GTM's History Change trigger, on in-app navigation. The first page view comes from the Google Tag. GA only. |
| outbound clicks | none | GA4 enhanced measurement. No code. |

## 1. GTM: import

1. Download the container file, `gtm-container.json`. You don't need a copy of the code:
   1. Open [github.com/kirollosd/gitprice-web](https://github.com/kirollosd/gitprice-web), go to `docs/analytics/gtm-container.json`, and click **Download raw file** (the download icon above the file).
   2. If the change isn't merged yet, switch to the `gp-376-ga-gtm` branch first.
2. Open [tagmanager.google.com](https://tagmanager.google.com) and open container **GTM-PLZZJV54**.
3. Go to **Admin → Import Container**.
   1. Choose the downloaded `gtm-container.json`.
   2. Workspace: **Default Workspace**.
   3. Import option: **Merge**, then **Rename conflicting tags, triggers and variables**.
   4. Review the summary and click **Confirm**. It should add 9 tags, 8 triggers and 10 variables.

### After import, check

- **Variables → Built-in Variables → Configure.** **Scroll Depth Threshold** and **History Source** are ticked. If either isn't, tick it.
- **Tags → GA4 - Google Tag.**
  - The Tag ID is `G-SM4YKS90F0`, and the trigger is **All Pages**.
  - Under **Configuration settings → Shared event settings**, the event settings variable is `{{GA4 Event Settings}}`. If it's empty, select it.
- **Tags → each GA4 Event tag.**
  - **Measurement ID** is `G-SM4YKS90F0`.
  - **Event Settings Variable** is `{{GA4 Event Settings}}`.
- **Every GA tag → Advanced Settings → Consent Settings.** It shows the built-in `analytics_storage` check and **No additional consent required**. Don't add `ad_storage` or any ad signal.
- **Triggers.**
  - **Scroll Depth - 25/50/75/90:** Vertical scroll depths, Percentages `25,50,75,90`, enabled on All Pages.
  - **History Change:** fires **GA4 Event - page_view**, on **Some History Changes** where `History Source` **does not equal** `replaceState`.
- **Renamed items.** If the import renamed anything (a name ending in `_1` or similar), an older copy already existed. Delete the old one, or compare it with the imported one.

## 2. GTM: publish

Click **Submit**, name the version (for example "GP-376 GA4 setup"), and **Publish**.

Nothing reaches the site yet: GTM only loads once step 4 is done.

## 3. GA4: property settings

Open [analytics.google.com](https://analytics.google.com) and the GitPrice property.

1. **Key event.** Go to **Admin → Data display → Events**.
   - If `waitlist_submit` is listed, mark it as a **key event**.
   - If it hasn't fired yet, go to **Key events → New key event** and enter `waitlist_submit` by name.
2. **Custom dimensions.** Go to **Admin → Data display → Custom definitions → Create custom dimension**. Create one for each name below, with scope **Event**, and with the dimension name the same as the event parameter:
   - `audience`
   - `placement`
   - `cta_id`
   - `section_id`
   - `store`
   - `locale`
3. **Enhanced measurement.** Go to **Admin → Data collection and modification → Data streams →** the web stream **→ Enhanced measurement** (gear icon).
   - Keep **Page views** on (that's the first page view of each visit), but under **Show advanced settings**, turn **Page changes based on browser history events** **off**. GTM's History Change tag sends those page views instead, with the URL redacted. Leaving both on would double-count, and GA's own version can send a stale or unredacted URL.
   - Keep **Outbound clicks** on.
   - Turn **Scrolls** **off**. GTM's scroll-depth trigger replaces it; leaving both on double-counts at 90%.
   - Turn **Form interactions** **off**. The waitlist form is a Tally iframe, and `waitlist_submit` already covers it.
4. **Data retention.** Go to **Admin → Data collection and modification → Data retention** and set event data retention to **14 months**.
5. **Search Console.** Go to **Admin → Product links → Search Console links → Link**, and choose the gitprice.com property.

## 4. Vercel: turn it on

1. Go to the Vercel project → **Settings → Environment Variables**.
2. Add `NEXT_PUBLIC_GTM_ID` = `GTM-PLZZJV54`, with **only Production** ticked. Don't tick Preview or Development.
3. **Redeploy** Production (Deployments → the latest Production deployment → Redeploy). `NEXT_PUBLIC_*` values are built in, so the change needs a new build.

## 5. Preview and verify

### GTM Preview

In GTM, click **Preview** and enter `https://gitprice.com`. Tag Assistant opens the site.

- [ ] Before you choose in the cookie notice, **GA4 - Google Tag** fires and consent shows `analytics_storage: denied`.
- [ ] Click **Allow**. Consent updates to `analytics_storage: granted`.
- [ ] Click a CTA, scroll the page, open the mobile menu, switch language, and move between pages (for example Home → Sellers). The matching **GA4 Event** tags fire, including **page_view** on each in-app page change. On the first load there should be **no** extra `page_view` from History Change; the first page view comes from the Google Tag alone.
- [ ] **Submit the waitlist form** (use a test address you can remove later). **GA4 Event - waitlist_submit** fires.

### Fresh browser profile

Use a new browser profile (or a private window with no extensions), open DevTools → **Application → Cookies**, and go to `https://gitprice.com`.

- [ ] **Before choosing.** In the Network tab, GTM (`googletagmanager.com/gtm.js`) loads and a GA4 hit is sent (`/g/collect`). **No** `_ga` or `_ga_*` cookie exists, and there's **no** Heap request.
- [ ] **Allow.** Click Allow. `_ga` and `_ga_*` cookies appear, and Heap loads.
- [ ] **Decline.** In another fresh profile, click Decline. No `_ga`, `_ga_*` or `_gid` cookie exists, before or after the page reloads.
- [ ] **Events.** In GA4 **Admin → Data display → DebugView** (with Tag Assistant open), each event in the table above appears when you do its action.
- [ ] **Redaction.** Open `https://gitprice.com/reset-password?x=1#token=abc`. In DebugView, `page_location` is `https://gitprice.com/reset-password`, with no `?` or `#`.
- [ ] **Previews stay quiet.** On a Vercel preview URL, no request goes to `googletagmanager.com`.
