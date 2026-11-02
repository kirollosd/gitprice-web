import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import LegalPage from "../app/components/LegalPage";

// GP-521 (owner, Nov 2): the policy describes analytics, hosting and storage by
// category only. No vendor names, no storage API names, no Pro tier in v1.
const BANNED = ["Vercel", "Heap", "Google", "chrome.storage", "Pro subscription", "اشتراك Pro", "privacy@"];

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
