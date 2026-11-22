import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DealsPage from "../app/components/DealsPage";
import { formatEGP, type DealList, type PublicDeal } from "../lib/deals";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

const deal: PublicDeal = {
  title: "Phone <X>", storeName: "Amazon Egypt", price: 1299, currency: "EGP", observedAt: "2026-11-21T12:05:00Z",
  insights: [{ kind: "low_90d" }, { kind: "cheaper_than", otherStore: "Noon", diff: 200 }, { kind: "mystery" }],
  buyUrl: "https://amazon.eg/dp/B0AAAAAAAA?tag=gitpriceeg-21", productUrl: "https://amazon.eg/dp/B0AAAAAAAA", status: "posted",
  listKey: "phones", listNameEn: "Phones", listNameAr: "هواتف",
};
const LISTS: DealList[] = [
  { key: "phones", nameEn: "Phones", nameAr: "هواتف", count: 3 },
  { key: "food", nameEn: "Food", nameAr: "طعام", count: 1 },
];
const render = (locale: "en" | "ar", deals: PublicDeal[], lists: DealList[] = [], selected: string | null = null) =>
  renderToStaticMarkup(createElement(DealsPage, { locale, deals, lists, selected }));


describe("DealsPage", () => {
  it("has no intro line under the heading", () => {
    expect(render("en", [deal])).not.toContain("Prices change, so check the store");
    expect(render("ar", [])).not.toContain("فتحقق من المتجر قبل الشراء");
  });

  it("deal card shows price, Cairo time and a sponsored buy link", () => {
    const html = render("en", [deal]);
    expect(html).toContain("Phone &lt;X&gt;");
    expect(html).toMatch(/1,299[\s\S]*EGP/);
    expect(html).toContain("Price at 21/11 14:05 Cairo time, may change");
    expect(html).toContain('href="https://amazon.eg/dp/B0AAAAAAAA?tag=gitpriceeg-21"');
    expect(html).toContain('rel="sponsored noopener"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain(">Buy at Amazon Egypt<");
  });

  it("isolates the product title so a Latin title ending in brackets reads right on the Arabic page", () => {
    expect(render("ar", [{ ...deal, title: "USB-A Cable (1m)" }])).toMatch(/<h2[^>]*dir="auto"[^>]*>USB-A Cable \(1m\)<\/h2>/);
  });

  it("no img for Amazon deals", () => {
    expect(render("en", [deal])).not.toContain("<img");
  });

  it("shows the insight lines in the page language and skips unknown kinds", () => {
    const en = render("en", [deal]);
    expect(en).toContain("Lowest price in 90 days");
    expect(en).toContain("200 EGP cheaper than Noon");
    expect(en).not.toContain("mystery");
    const ar = render("ar", [deal]);
    expect(ar).toContain("أرخص من Noon بـ 200 ج.م");
    expect(ar).toContain("السعر في 21/11 14:05 بتوقيت القاهرة وقد يتغير");
  });

  it("notes a changed price on an updated post", () => {
    expect(render("en", [{ ...deal, status: "updated" }])).toContain("The price has changed since this was posted.");
    expect(render("en", [deal])).not.toContain("has changed");
  });

  it("shows the calm empty state when there are no deals", () => {
    const html = render("ar", []);
    expect(html).toContain("لا توجد عروض الآن");
    expect(html).not.toContain("<li");
  });

  const one = (locale: "en" | "ar", insight: PublicDeal["insights"][number]) => render(locale, [{ ...deal, insights: [insight] }]);
  const items = (html: string) => [...html.matchAll(/<li>([^<]*)<\/li>/g)].map((m) => m[1]);

  it("renders each new insight kind in both languages", () => {
    const cases: [PublicDeal["insights"][number], string, string][] = [
      [{ kind: "drop_since_prev", diff: 6, ref: 1400, refDay: "2026-11-20" }, "6% lower than yesterday", "أقل بـ 6٪ من أمس"],
      [{ kind: "drop_since_prev", diff: 3, ref: 1350, refDay: "2026-11-20" }, "51 EGP lower than yesterday", "أقل بـ 51 ج.م من أمس"],
      [{ kind: "drop_since_prev", diff: 6, ref: 1400, refDay: "2026-11-15" }, "6% lower than the 15/11 price", "أقل بـ 6٪ من سعر 15/11"],
      [{ kind: "low_30d" }, "Lowest price in 30 days", "أقل سعر خلال 30 يومًا"],
      [{ kind: "low_all" }, "Lowest price since we started tracking it", "أقل سعر منذ بدأنا متابعته"],
      [{ kind: "below_avg_egp", diff: 500 }, `${formatEGP(500)} EGP below its 30-day average`, `أقل من متوسط آخر 30 يومًا بـ ${formatEGP(500)} ج.م`],
      [{ kind: "low_30d_everyday", diff: 12.4 }, "Lowest price in 30 days and 12% below average", "أقل سعر خلال 30 يومًا وأقل من المتوسط بنسبة 12٪"],
      [{ kind: "team_pick" }, "GitPrice team pick", "اختيار فريق GitPrice"],
    ];
    for (const [x, e, a] of cases) {
      expect(items(one("en", x)).slice(0, 1)).toEqual([e]);
      expect(items(one("ar", x)).slice(0, 1)).toEqual([a]);
    }
  });

  it("renders no insight line for an unknown kind or an unreadable refDay", () => {
    expect(items(one("en", { kind: "mystery" }))).toEqual([]);
    expect(items(one("en", { kind: "drop_since_prev", diff: 6, ref: 1400, refDay: "garbage <b>" }))).toEqual([]);
  });

  it("renders no drop line in EGP when the reference price is missing", () => {
    expect(items(one("en", { kind: "drop_since_prev", diff: 3, refDay: "2026-11-20" }))).toEqual([]);
  });

  it("keeps the same key set under web.deals in en and ar", () => {
    const keys = (o: unknown, p = ""): string[] =>
      o && typeof o === "object" ? Object.entries(o).flatMap(([k, v]) => keys(v, `${p}${k}.`)) : [p];
    const d = (x: typeof en) => keys((x as unknown as { web: { deals: unknown } }).web.deals).sort();
    expect(d(ar as unknown as typeof en)).toEqual(d(en));
  });

  describe("list chips", () => {
    const nav = (html: string) => html.match(/<nav[\s\S]*?<\/nav>/)?.[0] ?? "";
    const anchors = (html: string) => [...nav(html).matchAll(/<a ([^>]*)>([\s\S]*?)<\/a>/g)].map((m) => ({ attrs: m[1], text: m[2] }));

    it("renders All plus one link per list; the selected chip is .sel with aria-current", () => {
      const a = anchors(render("en", [deal], LISTS, "phones"));
      expect(a).toHaveLength(3);
      const phones = a[1];
      expect(phones.attrs).toContain('href="/deals?list=phones"');
      expect(phones.attrs).toContain('aria-current="page"');
      expect(phones.attrs).toMatch(/class="[^"]*\bsel\b/);
      expect(a[0].attrs).toContain('href="/deals"');
      expect(a[0].attrs).not.toContain("aria-current");
      expect(a[2].attrs).not.toContain("aria-current");
      expect(nav(render("en", [deal], LISTS, "phones"))).toContain('aria-label="Filter by list"');
    });

    it("marks All current when nothing is selected, and links Arabic chips under /ar", () => {
      const a = anchors(render("ar", [deal], LISTS, null));
      expect(a[0].attrs).toContain('aria-current="page"');
      expect(a[0].attrs).toContain('href="/ar/deals"');
      expect(a[1].attrs).toContain('href="/ar/deals?list=phones"');
      expect(a[0].text).toContain("الكل");
    });

    it("shows each chip name with its count in a span, in API order", () => {
      const a = anchors(render("en", [deal], LISTS, null));
      expect(a.map((x) => x.text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())).toEqual(["All", "Phones 3", "Food 1"]);
      expect(a[1].text).toMatch(/<span[^>]*>3<\/span>/);
    });

    it("renders no nav when there are no lists", () => {
      expect(render("en", [deal], [], null)).not.toContain("<nav");
    });

    it("escapes a hostile list name", () => {
      const html = render("en", [deal], [{ key: "bad_one", nameEn: "<b>", nameAr: "<b>", count: 1 }], null);
      expect(html).toContain("&lt;b&gt;");
      expect(html).not.toContain("<b>");
    });

    it("never builds an href from an invalid key", () => {
      const html = render("en", [deal], [{ key: "A b\"><x", nameEn: "X", nameAr: "X", count: 1 }], null);
      expect(html).not.toContain("<x");
      expect(html).not.toContain("list=A");
    });

    it("shows the row's list name in the page language as plain meta text, not a chip", () => {
      expect(render("ar", [deal])).toMatch(/<p class="[^"]*meta[^"]*">هواتف<\/p>/);
      const en = render("en", [deal]);
      expect(en).toMatch(/<p class="[^"]*meta[^"]*">Phones<\/p>/);
      expect(en).not.toContain("هواتف");
    });

    it("an empty selected list shows the empty copy plus an All link", () => {
      const html = render("en", [], LISTS, "food");
      expect(html).toContain("No deals right now.");
      expect(html.match(/<a [^>]*href="\/deals"[^>]*>All<\/a>/g)).toHaveLength(2); // the chip and the empty-state link
    });
  });
});
