import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import LegalPage from "../app/components/LegalPage";

// GP-521 (owner, Nov 2): the policy describes analytics, hosting and storage by
// category only. No vendor names, no storage API names, no Pro tier in v1.
const BANNED = ["Vercel", "Heap", "Google Analytics", "Google Tag Manager", "chrome.storage", "Pro subscription", "اشتراك Pro", "privacy@"];

describe("privacy page names no vendors and keeps the consent explanation", () => {
  it.each([
    ["en", "until you make a choice in the cookie notice", "Last updated November 2, 2026"],
    ["ar", "إلى أن تحدد اختيارك في إشعار ملفات تعريف الارتباط", "آخر تحديث: 2 نوفمبر 2026"],
  ] as const)("%s", (locale, consent, updated) => {
    const html = renderToStaticMarkup(createElement(LegalPage, { locale, name: "privacy" }));
    for (const word of BANNED) expect(html).not.toContain(word);
    expect(html.toLowerCase()).toContain(consent.toLowerCase());
    expect(html).toContain(updated);
  });
});

// GP-521: the site carries the reviewed extension policy (docs/operations/privacy-policy*.md) 1:1.
describe("privacy page carries the reviewed extension policy", () => {
  it.each(["en", "ar"] as const)("%s has 15 sections and its subheadings", (locale) => {
    const html = renderToStaticMarkup(createElement(LegalPage, { locale, name: "privacy" }));
    expect(html.match(/<h2 /g)).toHaveLength(15);
    expect(html.match(/<h3 /g)?.length).toBe(5);
  });

  it("quotes the Chrome Web Store Limited Use sentence and the ranking disclosure", () => {
    const html = renderToStaticMarkup(createElement(LegalPage, { locale: "en", name: "privacy" }));
    expect(html).toContain(
      "The use of information received from Google APIs will adhere to the Chrome Web Store User Data Policy, including the Limited Use requirements.",
    );
    expect(html).toContain("Being a partner never changes a store&#x27;s price.");
    expect(html).toContain("120 days");
  });
});
