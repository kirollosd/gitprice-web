# Analytics events

Every event goes to the GTM `dataLayer` and, once Heap has loaded (after Allow), to Heap. `locale` (`en`|`ar`, from `<html lang>`) is added to every event. Params never carry emails, form text or URL query strings.

Code: `lib/track.ts` (`track()`), `app/components/TrackListeners.tsx` (delegated clicks, section views, page-load `{locale}` push).

## Event table

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

Also pushed on mount and on every pathname change: `{locale}` (no `event`), which GTM's scroll_depth tag reads.

## `cta_id` values (snake_case, from what the CTA does)

| cta_id | placement | where |
|---|---|---|
| `features` | nav, menu | "Features" anchor to `/#features` |
| `how_it_works` | nav, menu | "How it works" anchor to `/#how-it-works` |
| `for_sellers` | nav, menu | seller link (only rendered when `NEXT_PUBLIC_SELLERS_NAV=1`) |
| `for_shoppers` | nav, menu | shopper link on `/sellers` (same flag) |
| `join_waitlist` | nav, menu | nav CTA before launch (anchor to `#waitlist`) |
| `install_extension` | nav, menu, hero, bottom | nav CTA after launch; `/sellers` launch access buttons |
| `back_to_shoppers` | bottom | `/sellers` back link |
| `privacy_policy` | footer | footer link |
| `terms` | footer | footer link |

## `store_click` values

`store`: `chrome`, `app_store`, `play`. `placement`: `hero`, `bottom`.

## `section_id` values

Existing element ids are reused as-is; others are snake_case names.

| section_id | pages |
|---|---|
| `hero` | Home, Sellers |
| `baseline` | Home |
| `features` | Home, Sellers (existing `id="features"`) |
| `how-it-works` | Home, Sellers (existing `id="how-it-works"`) |
| `privacy` | Home |
| `faq` | Home |
| `who` | Sellers |
| `bottom_cta` | Home, Sellers |

Sections taller than the screen cannot reach 50% visible, so a section also counts once half a viewport of it is visible.
