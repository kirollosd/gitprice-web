import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ar from "../i18n/ar.json";
import en from "../i18n/en.json";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

afterEach(cleanup);

describe("WebFooter tagline", () => {
  const cases: [string, "en" | "ar", string][] = [
    ["/sellers", "en", "Shows which rivals undercut you."],
    ["/sellers/", "en", "Shows which rivals undercut you."],
    ["/ar/sellers", "ar", ""],
    ["/", "en", "Compares prices while you shop."],
    ["/privacy", "en", "Compares prices while you shop."],
    ["/ar", "ar", ""],
  ];
  for (const [path, locale, text] of cases) {
    it(`${locale} ${path}`, async () => {
      pathname = path;
      const { default: WebFooter } = await import("../app/components/WebFooter");
      const { t } = await import("../lib/i18n");
      render(<WebFooter locale={locale} />);
      const key = /\/sellers\/?$/.test(path) ? "web.sellers.footer.tagline" : "web.component.webFooter.default.tagline";
      const expected = text || t(locale, key);
      expect(screen.getByText(expected)).toBeTruthy();
      const other = /\/sellers\/?$/.test(path) ? "web.component.webFooter.default.tagline" : "web.sellers.footer.tagline";
      expect(screen.queryByText(t(locale, other))).toBeNull();
    });
  }
});

describe("landing footer landmark", () => {
  it("#foot is the page's contentinfo even though it sits inside <main>", async () => {
    vi.doMock("../app/components/CookieNotice", () => ({ CookieSettingsButton: () => null }));
    const { default: Foot } = await import("../app/landing/Foot");
    const { products } = await import("../app/landing/products");
    render(<main><Foot locale="en" product={products[0]} /></main>);
    expect(document.querySelector("footer#foot")?.getAttribute("role")).toBe("contentinfo");
  });
});

// GP-906: the launched site has no launch email to send, so the footer facts stop promising one.
describe("landing footer facts", () => {
  afterEach(() => { vi.doUnmock("../lib/env"); vi.resetModules(); });
  const facts = async (launch: boolean, locale: "en" | "ar") => {
    vi.doMock("../app/components/CookieNotice", () => ({ CookieSettingsButton: () => null }));
    vi.doMock("../lib/env", () => ({ env: { launch, chromeStoreUrl: "https://c.test", appStoreUrl: "https://a.test", playStoreUrl: "https://p.test" } }));
    const { default: Foot } = await import("../app/landing/Foot");
    const { products } = await import("../app/landing/products");
    render(<main><Foot locale={locale} product={products[0]} /></main>);
    return document.querySelector("#foot p")!.innerHTML.replaceAll("&nbsp;", "\u00a0");
  };
  it("launched: no launch-email promise, in either language", async () => {
    expect(await facts(true, "en")).toBe(en.web.landing.foot.factsLaunch);
    cleanup(); vi.resetModules();
    expect(await facts(true, "ar")).toBe(ar.web.landing.foot.factsLaunch);
    expect(en.web.landing.foot.factsLaunch).not.toMatch(/email/i);
    expect(ar.web.landing.foot.factsLaunch).not.toMatch(/إيميل/);
  });
  it("prelaunch keeps the launch-email line (the waitlist form is there)", async () => {
    expect(await facts(false, "en")).toBe(en.web.landing.foot.facts);
  });
});
