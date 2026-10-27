import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import LegalPage from "../app/components/LegalPage";

describe("privacy page names Google Tag Manager and Google Analytics", () => {
  it.each([
    ["en", "Google Tag Manager and Google Analytics", "Last updated October 25, 2026"],
    ["ar", "Google Tag Manager وGoogle Analytics", "آخر تحديث: 25 أكتوبر 2026"],
  ] as const)("%s section 7 renders p4 and the new date", (locale, phrase, updated) => {
    const html = renderToStaticMarkup(createElement(LegalPage, { locale, name: "privacy" }));
    expect(html).toContain(phrase);
    expect(html).toContain(updated);
  });
});
