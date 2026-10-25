# Launch copy v2: audit and changes

Status: for owner review, 2026-10-25. Method: `website-copy` skill against the GitPrice brand files (tone of voice, offer/ICP, proof, sitemap, competitors, keywords, Arabic and SEO rules).
Applies to: the Copy tables in `2026-10-25-launch-polish-design.md` (Home) and the shipped `web.sellers.*` keys in the monorepo i18n (Sellers).
Once you approve, the accepted rows go into the spec tables. This file is then deleted.

## Verdict

- **Home:** mostly on-brand. Proof is checkable behavior, not invented. The privacy wording matches the verified wording. No store or country names, no "best price", no exclamation marks. There are 8 targeted fixes, listed below.
- **Sellers:** needs a new version. The Arabic is fully MSA and uses the banned «سعرًا أفضل» throughout. One English line makes a dated pricing promise. Every feature claim is unverified (see Needs human input #1).

## Home: changes

Rows not listed stay as they are in the spec.

| Key | Now | v2 | Why |
|---|---|---|---|
| EN header.cta | (missing) | Join the waitlist · alt: Save my spot | Every CTA needs EN and AR, plus a first-person variant. |
| AR form.cta | سجّل الأن | **سجّل الآن** · alt: احجزلي مكان | Spelling (done in the spec). |
| AR header.cta | سجّل وكن أول واحد | سجّل الآن · alt: احجزلي مكان | «كن» is MSA inside a colloquial page. Also matches the form CTA. |
| AR final.h2 | كن أول واحد يجربه قبل مواسم الخصومات | **خليك جاهز قبل مواسم الخصومات** | MSA «كن», and it said something different from the EN ("Be ready before the big sales"). |
| EN f1 body | …so you can check. | …so you can check. **Prices are live, checked when you open the product.** | Adds the owner-stated edge ("live prices"), which was missing from Home. |
| AR f1 body | …عشان تتأكد بنفسك. | …عشان تتأكد بنفسك. **والأسعار لحظية، بيشيّك عليها ساعة ما تفتح المنتج.** | Same as EN. |
| EN how.1 | One click from the Chrome Web Store. Free. | **Add it from the Chrome Web Store. It's free.** | Installing takes two clicks (Add, then confirm), so "one click" can be checked and found false. |
| AR how.1 | دوسة واحدة من متجر كروم. ومجاني. | **ضيفه من متجر كروم، ومجاني.** | Same as EN. |
| AR faq.1 | …3 تنبيهات أسعار مجانًا… | …3 تنبيهات أسعار **ببلاش**… | trust.1 says «ببلاش». Use one word for free on the page. |

Optional subhead variant (owner picks; the current one is fine):
- EN: "Open any product on a supported store. GitPrice checks live prices at other stores and shows, right on the page, if the same product costs less. Prefer to wait? Set a price alert."
- AR: «افتح أي منتج في متجر مدعوم، وGitPrice هيشيّك على الأسعار اللحظية في المتاجر التانية ويقولك في نفس الصفحة لو نفس المنتج أرخص. ولو مستني السعر ينزل، اعمل تنبيه.»

### Home SEO (the spec left this to the builder; drafted so it can be approved with the copy)

| | EN | AR |
|---|---|---|
| title | See where it costs less, before you buy \| GitPrice | اعرف فين أرخص سعر قبل ما تشتري \| GitPrice |
| description | GitPrice compares prices on the product page you're already on, matches the exact product, and tells you when it isn't sure. Free Chrome extension with price alerts and price history. | ‏GitPrice بيقارن الأسعار في صفحة المنتج اللي انت فاتحها، وبيطابق نفس المنتج بالظبط، ولو مش متأكد بيقولك. إضافة كروم مجانية فيها تنبيهات أسعار وسجل الأسعار. |

Both use the job words from `keywords.md` (compare prices, price alert, price history, «أرخص سعر», «سجل الأسعار»). They don't use store, country or volume claims.

## Sellers: v2

The English is a light edit; only the changed keys are listed. The Arabic is a full rewrite in light Egyptian, using your terms «بيكسر سعرك» and «بيبيع أرخص منك».

### English (changed keys only)

| Key | v2 | Why |
|---|---|---|
| hero.micro | Premium is a paid plan for sellers. Pricing isn't set yet. | "Pricing is announced at launch" promises a date and price timing. Prices are undecided (GP-272). |
| prelaunch / cta submit | Join the seller waitlist · alt: Save my seller spot | Two-variant CTA rule. |
| features.7.body | Includes Pro for shoppers: 100 alerts and longer price history. | Spec goal 8 line. It says "longer", to match Pro everywhere else (the spec line says "full"; see Needs human input #3). |

### Arabic (all keys)

| Key | v2 |
|---|---|
| hero.headline | اعرف مين بيكسر سعرك، وفي أنهي منتج |
| hero.sub | ‏GitPrice Premium بيوريك سعرك واقف فين في كل منتج بتتابعه، ولو في حد بيبيع أرخص منك، بيقولك بكام. |
| hero.micro | ‏Premium خطة مدفوعة للبائعين، وسعرها لسه متحددش. |
| prelaunch submit / cta submit | سجّل في قايمة البائعين · alt: احجزلي مكان |
| prelaunch note / cta.line / cta note | إيميل واحد لما نفتح للبائعين، ومن غير سبام. |
| visual.rival.1/2/3.count | أرخص منك في 14 منتج · أرخص منك في 6 منتجات · أرخص منك في 3 منتجات |
| visual.rival.pinned | متثبّت |
| features.heading | هتاخد إيه |
| f1 | اعرف أول ما حد يكسر سعرك / هيوصلك تنبيه لما بائع تاني يعرض نفس المنتج بسعر أرخص منك. |
| f2 | شوف كل منتج واقف فين / في كل منتج هتعرف إذا كان سعرك هو الأرخص. ولو لأ، هتعرف مين بيبيع أرخص منك وبكام. |
| f3 | تابع كل منتج مع الوقت / شوف الأسعار اتحركت إزاي في كل منتج، عشان تعرف امتى حد كسر سعرك. |
| f4 | شيّك على منتجات كتير مرة واحدة / ضيف منتجاتك كلها مرة واحدة، وشوف في قايمة واحدة أنهي منتجات حد كاسر سعرها. |
| f5 | السعر اللي يرجّعك الأرخص / اعرف أنهي سعر يخليك الأرخص. وGitPrice عمره ما بيغيّر أسعارك. |
| f6 | ضيف منتجاتك بالطريقة اللي تريحك / لينك متجرك أو ملف CSV. |
| f7 | كل حاجة في Pro / بيشمل Pro للمتسوقين: 100 تنبيه وتاريخ أسعار كامل. (your line, unchanged) |
| how.heading | بيشتغل إزاي؟ |
| how.1 | ضيف منتجاتك / واحد واحد أو كلهم مرة واحدة. |
| how.2 | ‏GitPrice بيشيّك على المنافسين / بنقارن كل منتج بنفس المنتج عند بائعين تانيين. |
| how.3 | اتصرّف على حسب الفرق / شوف مين بيبيع أرخص منك وبكام، وبعدين غيّر سعرك أو سيبه زي ما هو. |
| who | للي بيبيعوا على الأسواق الأونلاين وعايزين يعرفوا، منتج منتج، إذا كان سعرهم هو الأرخص. |
| cta.title | سجّل وهنبلغك أول ما نفتح للبائعين. |
| prelaunchJoined body | هنبعتلك إيميل واحد لما نفتح للبائعين. |
| backToShoppers | ‏GitPrice للمتسوقين |
| footer.tagline | بيوريك مين بيكسر سعرك. |
| launch nav / hero / cta label | سجّل كبائع · alt: عايز حساب بائع |
| launch.cta.title | اعرف مين بيكسر سعرك النهارده. |
| SEO title | اعرف مين بيكسر سعرك \| GitPrice (noindex; used for sharing) |

## Needs human input

1. **Seller features aren't in the code on main.** I found no undercut alerts, CSV import, storefront link, bulk add or Seller mode switch in `extension/src`, `services` or `mobile`. The Sellers page describes them in the present tense. Either confirm they're built (or will be before seller access opens), or I'll reframe the features block as "What seller access will include".
2. **«سجل الأسعار» or «تاريخ الأسعار».** Home uses «سجل الأسعار» 5 times. You changed the Sellers line to «تاريخ أسعار». Pick one for both pages. I recommend «سجل الأسعار», because it's how people phrase the search (`keywords.md`).
3. **Sellers line: "full" or "longer" price history.** Pro is "longer price history" everywhere else. "Full" claims more. Pick one.
4. **Live prices.** This is owner-stated, not yet shown in a competition analysis. It's a behavior claim, not a comparison, so the brand rules allow it. Confirm it's true for every supported store before launch.
5. **Privacy policy §1.** It still says "pages you browse on supported stores" and doesn't mention order confirmation pages. Update it before trust.3 and faq.4 ship (`TODO(privacy-policy)`).
6. **Arabic native read.** The brand's Arabic rules are pending your native review. Read the Sellers AR aloud once before merge.
