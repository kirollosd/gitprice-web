import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DealsPage from "../app/components/DealsPage";
import type { PublicDeal } from "../lib/deals";

const deal: PublicDeal = {
  title: "Phone <X>", storeName: "Amazon Egypt", price: 1299, currency: "EGP", observedAt: "2026-11-21T12:05:00Z",
  insights: [{ kind: "low_90d" }, { kind: "cheaper_than", otherStore: "Noon", diff: 200 }, { kind: "mystery" }],
  buyUrl: "https://amazon.eg/dp/B0AAAAAAAA?tag=gitpriceeg-21", productUrl: "https://amazon.eg/dp/B0AAAAAAAA", status: "posted",
};
const render = (locale: "en" | "ar", deals: PublicDeal[]) => renderToStaticMarkup(createElement(DealsPage, { locale, deals }));

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
});
