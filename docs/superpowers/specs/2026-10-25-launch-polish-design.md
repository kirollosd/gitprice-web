# Launch polish (gitprice-web) — design

Status: draft for owner approval, 2026-10-25.
Inputs: owner's launch brief (marketing plugin, "GitPrice website: launch-readiness brief") and a friend's Arabic mockup ("gitprice-mockup-ar-option-a.pdf"). Owner decisions from the 2026-10-25 review below override both documents where they disagree.

## Why

Chrome Web Store submission is around Nov 6 and the extension launches around Nov 13, ahead of the big sale season. Before then, the homepage has to read naturally to Arabic-speaking shoppers, carry a clear privacy claim that matches the extension, show no layout bugs, load fast cold, and switch cleanly from waitlist to install on launch day.

Success: on launch day the owner flips one switch, every CTA becomes the install CTA, and nothing on `/` or `/ar` overlaps, truncates, contradicts the privacy policy or takes seconds to load.

## Owner decisions (binding)

| Topic           | Decision                                                                                                                                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Arabic register | Home and Sellers marketing copy: **light Egyptian colloquial**. Privacy, Terms and the cookie-settings label (`إعدادات ملفات تعريف الارتباط`) stay MSA. Replaces the earlier MSA-only rule for marketing pages. Term rules stay: الموديل, never الطراز. |
| Positioning     | **Generic, as today.** No country, no store names (no Egypt, Amazon.eg, noon, Jumia) in H1, titles, meta, trust strip, FAQ, mock or OG images. The mock keeps Store A / B / C. No `en_EG`/`ar_EG` locales.                                              |
| Sale hook       | Name the sale seasons generically: White Friday, Black Friday, Yellow Friday ("fake discounts during the big sales"). No store tied to a season.                                                                                                        |
| Launch date     | **Not stated.** "One email when we launch."                                                                                                                                                                                                             |
| Privacy claim   | The extension reads order confirmation pages. Use one wording everywhere (trust strip, FAQ, privacy section). Leave `TODO(privacy-policy)` so the policy and the CWS privacy tab match.                                                                 |
| Currency        | **None**, as today. Plain Western digits.                                                                                                                                                                                                               |
| Copy source     | The brief's copy tables are the base, de-store-named; PDF lines are borrowed where they read better (marked below).                                                                                                                                     |
| Structure       | **Code first, Sketch later.** Rebuild Home to the brief's structure now. Parity checks for boards whose content changes are skipped (with a reason) until Web.sketch is redrawn after launch.                                                           |
| Spelling        | US English site-wide ("color").                                                                                                                                                                                                                         |
| Launch switch   | Full swap: with launch on, header, hero and final band use the install CTA ("Add to Chrome, it's free" / "أضِفه لكروم، مجانًا") with the official Chrome Web Store badge, linking to a configurable store URL; the hero form hides.                     |
| Pro / free      | Free: unlimited comparing (limited-time offer), 3 price alerts. Pro (not on sale at launch): 100 alerts, longer price history.                                                                                                                                               |

## Goals

1. Homepage rebuilt in this order, EN + AR: header (logo, Features, How it works, FAQ, language switch, CTA) → hero (eyebrow, H1, subhead, form or install CTA, product mock) → trust strip (exactly 4) → features (exactly 3, alternating text/visual: Compare, Price alerts, Price history) → one "Next up" line → How it works (3 steps) → FAQ (5) → dark final CTA band → footer (tagline, "not affiliated" line, Support link).
2. Removed from Home: the four text grids (Compare / Know when to buy / See it add up / Your way), the milestones item, all Coming-soon cards, the standalone "What GitPrice looks at" section (its content moves to the trust strip and FAQ). Desktop gap between hero and trust strip tightened.
3. Bugs: AR hero card overlapping the subhead at ~1024 px (P0-1); ellipses anywhere in the hero mock (P0-2).
4. Performance: confirm the reported ~10 s cold first byte; make `/`, `/ar`, `/sellers`, `/ar/sellers`, `/privacy`, `/terms` (and AR) fully static. Done when a cold load after 30 min idle has first byte under 1 s, with the method reported.
5. SEO: generic titles/descriptions per page and language; `SoftwareApplication` + `Organization` JSON-LD on `/` and `/ar` (free offer, no currency; see Builder notes); `/sellers` and `/ar/sellers` get `noindex` and leave the sitemap but stay reachable.
6. Share images: both OG images redesigned (headline + the "1,250 less" badge visual, logo, green accent; AR is real RTL Arabic, rendered the way `og-ar.png` is today since Satori can't shape Arabic). Sellers get their own OG text.
7. Cookie notice: slim bottom bar on desktop that never covers the hero form at 1024×768; Decline and Allow stay equal weight; consent logic unchanged.
8. Sellers page: nav anchors point to Sellers sections, not `/#features`; Arabic uses "بيكسر سعرك" / "بيبيع أرخص منك" (mock rows "أرخص منك في 14 منتج"); one line under "Everything in Pro": "Includes Pro for shoppers: 100 alerts and full price history." / "بيشمل Pro للمتسوقين: 100 تنبيه وتاريخ أسعار كامل."
9. Extras: footer Support link; `/goodbye` + `/ar/goodbye` uninstall page with one question "Why did you leave?"; a short install / how-to page per language; a hero video slot behind a flag (see Open questions).
10. Alt text on every non-decorative image; `alt=""` + `aria-hidden` only for decoration.

## Non-goals and anti-goals

- No blog, product pages or price-data pages. No store logos or store styling. No invented stats, ratings, user counts or testimonials (`[PLACEHOLDER]` if a slot needs one).
- No extension code or string changes. Where the site quotes an extension string (variant warning "May be a different model", "I bought this"), add `TODO(sync-extension)`.
- Privacy and Terms text unchanged except the order-confirmation alignment flagged above.
- Anti-goal: anything that makes the homepage dynamic per request (it would undo goal 4).
- Anti-goal: Egyptian colloquial leaking into Privacy, Terms, or legal labels.

## Constraints

- Copy lives in the monorepo `design-system/i18n/{en,ar}.json` under `web.*` and is synced with `node scripts/sync-design.mjs <monorepo worktree>`; never edit `gitprice-web/i18n/*.json` by hand. Key-count pin in `design-system/metrics/i18n.test.mjs`. Removed sections' keys are deleted, not left unused.
- Two branches: gitprice-web `launch-polish` (this worktree) and a monorepo branch for the i18n. Monorepo merges first.
- Keep RLM before Latin words that start an RTL line. Email inputs stay `dir="ltr"`. Badge and panel both say "أرخص بـ", never "أقل بـ"; headlines never "أفضل سعر".
- Visual language unchanged: Fustat + Noto Sans Arabic, tokens from `styles/tokens.css`, green only for savings, light and dark.
- QA widths: 375, 1024, 1280, 1440, light and dark, both languages; no horizontal scroll on mobile.
- CircleCI is not ready: local CI (vitest, lint, tsc, Playwright) is the merge gate.

## Copy

Brief wording with stores and dates removed. ⟨PDF⟩ marks a line borrowed from the friend's mockup; ⟨new⟩ marks a line written to replace a store-named or dated one.

### English

| Key                         | Text                                                                                                                                                                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| eyebrow                     | Free Chrome extension ⟨new: drops "for shoppers in Egypt"⟩                                                                                                                                                                                                                     |
| h1                          | See where it costs less, before you buy.                                                                                                                                                                                                                                       |
| subhead                     | Open any product on a supported store. GitPrice shows if the same product is cheaper at another store, right on the page. Prefer to wait? Set a price alert.                                                                                                                   |
| form.label / cta            | Email / Join the waitlist                                                                                                                                                                                                                                                      |
| form.note                   | One email when we launch. No spam.                                                                                                                                                                                                                                             |
| trust.1                     | **Free, no card.** Unlimited comparing for a limited time. 3 price alerts included.                                                                                                                                                                                                   |
| trust.2                     | **Works where you shop.** A growing list of supported stores. ⟨new⟩                                                                                                                                                                                       |
| trust.3                     | **Private by design.** Reads product and order confirmation pages on supported stores only. Never sold.                                                                                                                                                                        |
| trust.4                     | **Arabic and English.**                                                                                                                                                                                                                                                        |
| features.h2                 | Three ways it saves you money                                                                                                                                                                                                                                                  |
| f1                          | COMPARE / The same product, or it tells you / GitPrice matches brand, model, size and storage. Switch color or size and it checks again. When it isn't sure, it says "May be a different model" so you can check. `TODO(sync-extension)`                                       |
| f2                          | PRICE ALERTS / Get alerted when the price drops / Set the price you want to pay. When any supported store reaches it, GitPrice tells you. You choose how often it checks.                                                                                                      |
| f3                          | PRICE HISTORY / Spot the fake discount / Was the price raised the week before the sale? The price history chart shows you, so a White Friday, Black Friday or Yellow Friday deal has to be a real one. ⟨new: seasons⟩                                                          |
| nextUp                      | **Next up:** Email and phone alerts · Sync across devices · Pro: 100 alerts and longer history                                                                                                                                                                                 |
| how.h2 / 1–3                | How it works / **Add it to Chrome.** One click from the Chrome Web Store. Free. / **Shop as usual.** Open a product on a supported store. The badge shows if it's cheaper elsewhere. / **Buy where it costs less.** Jump to that store, or set an alert and wait for the drop. |
| faq.1                       | **Is GitPrice free?** Yes. Comparing is free and unlimited for a limited time, and you get 3 price alerts free. Pro, coming later, adds 100 alerts and longer price history.                                                                                                                      |
| faq.2                       | **Which stores does it work on?** A growing list of the stores you already shop at. When a store isn't supported, GitPrice stays quiet instead of guessing. ⟨new⟩                                                                                  |
| faq.3                       | **Is it really the same product?** GitPrice matches brand, model, size and storage. When it isn't sure, it says so, so you can check before you buy.                                                                                                                           |
| faq.4                       | **What does GitPrice see?** Product pages and order confirmation pages on supported stores, nothing else. Not your browsing history, passwords or payment details. We never sell your data. [Read the privacy policy] `TODO(privacy-policy)`                                   |
| faq.5                       | **Are big-sale discounts real?** Some aren't. Price history shows if a price was raised before White Friday, Black Friday or Yellow Friday. Compare before you pay. ⟨new: seasons⟩                                                                                             |
| final.h2 / sub              | Be ready before the big sales. / Free Chrome extension. One email when we launch. ⟨new⟩                                                                                                                                                                                        |
| footer.tagline / disclaimer | Compares prices while you shop. / Not affiliated with the stores it compares. ⟨new⟩                                                                                                                                                                                            |
| launched.cta                | Add to Chrome, it's free                                                                                                                                                                                                                                                       |
| mock caption                | Illustrative prices.                                                                                                                                                                                                                                                           |

### Arabic (light Egyptian)

| Key                            | Text                                                                                                                                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| eyebrow                        | إضافة مجانية لمتصفح كروم ⟨new⟩                                                                                                                                                                                                             |
| h1                             | اعرف فين أرخص سعر قبل ما تشتري                                                                                                                                                                                                             |
| subhead                        | افتح أي منتج في متجر مدعوم، وGitPrice هيقولك لو نفس المنتج أرخص في متجر تاني، وفي نفس الصفحة. ولو مستني السعر ينزل، اعمل تنبيه.                                                                                                            |
| form.label / cta               | الإيميل / سجّل الآن                                                                                                                                                                                                                        |
| header.cta                     | سجّل وكن أول واحد                                                                                                                                                                                                                          |
| form.note                      | هنبعتلك إيميل يوم الإطلاق. ⟨new⟩                                                                                                                                                                                                           |
| trust.1                        | **مجاني، من غير فيزا.** المقارنة مجانية ومن غير حدود لفترة محدودة، ومعاك 3 تنبيهات أسعار ببلاش.                                                                                                                                                         |
| trust.2                        | **شغال في المتاجر اللي بتشتري منها.** قايمة متاجر بتكبر مع الوقت. ⟨new⟩                                                                                                                                              |
| trust.3                        | **خصوصيتك محفوظة.** بيقرأ صفحات المنتجات وتأكيد الطلب في المتاجر المدعومة بس. ومبنبيعش بياناتك.                                                                                                                                            |
| trust.4                        | **عربي وإنجليزي.**                                                                                                                                                                                                                         |
| nav                            | المميزات · بيشتغل إزاي؟ · أسئلة شائعة                                                                                                                                                                                                      |
| features.h2                    | 3 طرق بيوفّرلك بيها فلوس                                                                                                                                                                                                                   |
| f1                             | المقارنة / نفس المنتج بالظبط، ولو مش متأكد هيقولك / GitPrice بيقارن الماركة والموديل والمقاس والمساحة. غيّر اللون أو المقاس وهو يقارن تاني. ولو مش متأكد، هيكتبلك «ممكن يكون موديل مختلف» عشان تتأكد بنفسك.                                |
| f2                             | تنبيهات الأسعار / مش وقت الشراء؟ حدّد سعرك ⟨PDF⟩ / حدّد السعر اللي عايز تدفعه، ولما أي متجر يوصله هنبلغك. وانت اللي بتختار GitPrice يشيّك كل قد إيه.                                                                                       |
| f3                             | سجل الأسعار / اكشف الخصم الوهمي / السعر اتعلّى قبل «العرض» بأسبوع؟ رسم سجل الأسعار هيوريك، عشان عرض الجمعة البيضاء أو البلاك فرايداي أو الجمعة الصفرا يبقى عرض بجد. ⟨new: seasons⟩                                                         |
| alert.reached                  | وصل للسعر اللي عايزه                                                                                                                                                                                                                       |
| nextUp                         | **جاي قريب:** تنبيهات على الإيميل والموبايل · مزامنة بين أجهزتك · Pro: 100 تنبيه وسجل أسعار أطول                                                                                                                                           |
| how.h2 / 1–3                   | بيشتغل إزاي؟ / **ضيفه لكروم.** دوسة واحدة من متجر كروم. ومجاني. / **اتسوّق عادي.** افتح أي منتج في متجر مدعوم، والعلامة هتقولك لو أرخص في حتة تانية. / **اشتري من المكان الأرخص.** روح للمتجر ده على طول، أو اعمل تنبيه واستنى السعر ينزل. |
| faq.h2                         | أسئلة شائعة                                                                                                                                                                                                                                |
| faq.1                          | **هل GitPrice مجاني؟** أيوه. المقارنة مجانية ومن غير حدود لفترة محدودة، ومعاك 3 تنبيهات أسعار مجانًا. نسخة Pro جاية بعدين بـ 100 تنبيه وسجل أسعار أطول.                                                                                                 |
| faq.2                          | **شغال على أنهي متاجر؟** قايمة متاجر بتكبر مع الوقت. ولو المتجر مش مدعوم، GitPrice بيسكت بدل ما يخمّن. ⟨PDF + new⟩                                                                                                   |
| faq.3                          | **أضمن إزاي إنه نفس المنتج؟** GitPrice بيقارن الماركة والموديل والمقاس والمساحة. ولو مش متأكد، هيقولك عشان تتأكد قبل ما تشتري.                                                                                                             |
| faq.4                          | **GitPrice بيشوف إيه؟** صفحات المنتجات وصفحات تأكيد الطلب في المتاجر المدعومة بس. مش بيشوف سجل التصفح ولا الباسوردات ولا بيانات الدفع، ومبنبيعش بياناتك. [اقرأ سياسة الخصوصية]                                                             |
| faq.5                          | **هل خصومات المواسم الكبيرة حقيقية؟** مش كلها. سجل الأسعار بيوريك لو السعر اتعلّى قبل الجمعة البيضاء أو البلاك فرايداي أو الجمعة الصفرا. قارن قبل ما تدفع. ⟨new⟩                                                                           |
| final.h2 / sub                 | كن أول واحد يجربه قبل مواسم الخصومات / إضافة كروم مجانية. هنبعتلك إيميل واحد بس يوم الإطلاق. ⟨new⟩                                                                                                                                         |
| footer.tagline / disclaimer    | بيقارن الأسعار وانت بتتسوّق. / GitPrice مالوش علاقة بالمتاجر اللي بيقارن أسعارها. ⟨new⟩                                                                                                                                                    |
| launched.cta                   | أضِفه لكروم، مجانًا                                                                                                                                                                                                                        |
| mock badge / buttons / caption | أرخص بـ 1,250 / روح للمتجر ب · اعمل تنبيه سعر / أسعار توضيحية.                                                                                                                                                                             |

SEO strings (generic, both languages) and the Sellers, goodbye and install-page copy are drafted by the builder in the same register and shown to the owner in the PR for approval before merge.

## Left to the builder

- Component structure, CSS, and how sections map to existing components (`HomeSections`, `BoardArt`, `CookieNotice`, `WebFooter`, `NavLinks`).
- How to prove static rendering and measure cold TTFB (e.g. build output route table + a timed request after idle).
- Hero mock: 3 rows, wider panel or shorter labels; whichever removes all ellipses at every QA width.
- Which parity cases to skip and the skip reason text.
- Commit granularity (one per goal is fine).

## Resolved owner answers (2026-10-25)

1. **Hero video flag:** Vercel Flags SDK (`flags` package), toggled from the Vercel toolbar without redeploy. It must not make Home dynamic: use the SDK's precompute pattern (middleware evaluates the flag and rewrites to a statically generated variant), so goal 4 still holds. Flag off renders the static mock exactly as today; flag on renders `<video autoplay muted loop playsinline>` with the mock as poster. No video asset is required for launch.
2. **/goodbye answers:** analytics event only (GA4 + Heap, consent rules as today), carrying the chosen reason. No server change.
3. **Support link:** `mailto:support@gitprice.com`, also used as the Chrome Web Store support URL.
4. **Claims:** "You choose how often it checks" and the Next-up line are both true; ship as written.
5. **Chrome Web Store URL:** config placeholder `[CWS_URL]` until the listing exists.

## Follow-up outside this project

Supported-store list: the site never names stores. The extension will show users which stores are supported (recorded in the monorepo extension surface docs); the site's "growing list" copy relies on that.

## Builder notes

- JSON-LD `offers`: `price: 0` without `priceCurrency` may fail Google's validator; if so, omit `offers` rather than add a currency (generic positioning wins).
- The Arabic share image stays a committed PNG rendered from tokens (see `scripts/render-og-ar.mjs`); extend that script for the new design and for the Sellers images.
- When launch is on, `StoreBadges` already replaces the hero form; extend it to header and final band and to the official CWS badge artwork per Google's branding rules.
