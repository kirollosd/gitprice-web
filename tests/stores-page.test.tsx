import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import StoresPage from "../app/components/StoresPage";
import type { CountryGroup } from "../lib/stores";

const groups: CountryGroup[] = [
  { country: "EG", stores: [{ id: 1, name: "Amazon", domain: "amazon.eg", country: "EG", url: "https://www.amazon.eg/?tag=gitpriceeg-21" }] },
  { country: "SA", stores: [{ id: 9, name: "Noon", domain: "noon.com", country: "SA", url: "https://www.noon.com/saudi-en/" }] },
];
const render = (locale: "en" | "ar", g: CountryGroup[]) => renderToStaticMarkup(createElement(StoresPage, { locale, groups: g }));

describe("StoresPage", () => {
  it("lists each country under its own heading, in the page language", () => {
    expect(render("en", groups)).toMatch(/<h2[^>]*>Egypt<\/h2>[\s\S]*<h2[^>]*>Saudi Arabia<\/h2>/);
    expect(render("ar", groups)).toContain(">مصر</h2>");
  });

  it("links each store to the API url as a sponsored new-tab link", () => {
    const html = render("en", groups);
    expect(html).toContain('href="https://www.amazon.eg/?tag=gitpriceeg-21"');
    expect(html).toContain('rel="sponsored noopener"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('aria-label="Go to Amazon (opens in a new tab)"');
  });

  it("shows the calm empty state when there are no stores", () => {
    const html = render("ar", []);
    expect(html).toContain("قائمة المتاجر غير متاحة الآن");
    expect(html).not.toContain("<h2");
  });
});
