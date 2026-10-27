import { cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { t } from "../lib/i18n";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }), useSearchParams: () => new URLSearchParams(), usePathname: () => "/" }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

afterEach(() => { cleanup(); vi.doUnmock("../lib/env"); vi.resetModules(); });

const label = (l: "en" | "ar") => t(l, "web.landing.beta");
const tags = () => [...document.querySelectorAll<HTMLElement>("[data-beta]")];
const near = (el: Element | null, sel: string) => !!el && !!el.parentElement?.querySelector(sel);

async function home(launch: boolean, locale: "en" | "ar") {
  vi.doMock("../lib/env", () => ({ env: { launch, apiBaseUrl: "http://x", chromeStoreUrl: "https://c.test", appStoreUrl: "https://a.test", playStoreUrl: "https://p.test" } }));
  const { default: HomeContent } = await import("../app/components/HomeSections");
  const { default: Dock, JoinProvider } = await import("../app/landing/Dock");
  const { default: WebFooter } = await import("../app/components/WebFooter");
  render(<JoinProvider><main><HomeContent locale={locale} /></main><Dock locale={locale} /><WebFooter locale={locale} /></JoinProvider>);
}

describe.each([[false], [true]])("Beta tag (launch=%s)", (launch) => {
  for (const locale of ["en", "ar"] as const) {
    it(`${locale}: sits by the hero CTA and the dock CTA, and in the footer`, async () => {
      await home(launch, locale);
      expect(label(locale)).toBe(locale === "en" ? "Beta" : "بيتا");
      expect(tags().map((b) => b.textContent)).toEqual([label(locale), label(locale), label(locale)]);
      const [hero, dock, foot] = tags();
      expect(near(hero, '[data-gp-placement="hero"]')).toBe(true);
      expect(hero.closest("#num")).toBeTruthy();
      expect(dock.closest("#dock")).toBeTruthy();
      expect(foot.closest("footer")).toBeTruthy();
    });
  }
});

describe("StoreBadges (phase 1: extension only)", () => {
  it("renders Add to Chrome and no App Store / Google Play link", async () => {
    vi.doMock("../lib/env", () => ({ env: { launch: true, chromeStoreUrl: "https://c.test", appStoreUrl: "https://a.test", playStoreUrl: "https://p.test" } }));
    const { default: StoreBadges } = await import("../app/components/StoreBadges");
    render(<StoreBadges locale="en" placement="hero" />);
    expect([...document.querySelectorAll("a")].map((a) => a.getAttribute("href"))).toEqual(["https://c.test"]);
    expect(document.querySelector('[data-gp-store="app_store"], [data-gp-store="play"]')).toBeNull();
  });
});
