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
  vi.doMock("../lib/env", () => ({ env: { launch, apiBaseUrl: "http://x", chromeStoreUrl: "https://c.test" } }));
  const { default: HomeContent } = await import("../app/components/HomeSections");
  const { default: Dock, JoinProvider } = await import("../app/landing/Dock");
  // the landing's own footer (Foot, inside #foot) carries the tag; the layout's WebFooter steps aside on home
  render(<JoinProvider><main><HomeContent locale={locale} /></main><Dock locale={locale} /></JoinProvider>);
}

describe.each([[false], [true]])("Beta tag (launch=%s)", (launch) => {
  for (const locale of ["en", "ar"] as const) {
    it(`${locale}: sits by the hero CTA and the dock CTA, and in the footer`, async () => {
      await home(launch, locale);
      expect(label("en")).toBe("Beta");
      // the owner's ruling: "Beta" in every locale, never translated
      expect(tags().map((b) => b.textContent)).toEqual(["Beta", "Beta", "Beta"]);
      const [hero, foot, dock] = tags();
      expect(near(hero, '[data-gp-placement="hero"]')).toBe(true);
      expect(hero.closest("#num")).toBeTruthy();
      expect(dock.closest("#dock")).toBeTruthy();
      expect(foot.closest("footer#foot")).toBeTruthy();
      // always the Latin word, isolated left-to-right inside the Arabic page
      for (const b of [hero, dock, foot]) { expect(b.getAttribute("dir")).toBe("ltr"); expect(b.getAttribute("lang")).toBe("en"); }
    });
  }
});

describe("StoreBadges (phase 1: extension only)", () => {
  it("renders Add to Chrome and no App Store / Google Play link", async () => {
    vi.doMock("../lib/env", () => ({ env: { launch: true, chromeStoreUrl: "https://c.test" } }));
    const { default: StoreBadges } = await import("../app/components/StoreBadges");
    render(<StoreBadges locale="en" placement="hero" />);
    expect([...document.querySelectorAll("a")].map((a) => a.getAttribute("href"))).toEqual(["https://c.test"]);
    expect(document.querySelector('[data-gp-store="app_store"], [data-gp-store="play"]')).toBeNull();
  });
});

describe("Beta tag in the landing header (phones)", () => {
  for (const locale of ["en", "ar"] as const) {
    it(`${locale}: sits right before the header Join button (DOM order = screen order) and shows only where the hero CTA is hidden (html.lp-m)`, async () => {
      vi.doMock("../lib/env", () => ({ env: { launch: false, apiBaseUrl: "http://x", chromeStoreUrl: "https://c.test", sellersNav: false } }));
      vi.doMock("../app/landing/LangMenu", () => ({ default: () => null }));
      const { default: WebNav } = await import("../app/components/WebNav");
      const { JoinProvider } = await import("../app/landing/Dock");
      render(<JoinProvider><WebNav locale={locale} variant="landing" /></JoinProvider>);
      const join = document.querySelector<HTMLElement>('header [data-join][data-gp-placement="nav"]')!;
      const tag = join.previousElementSibling as HTMLElement;
      expect(tag.hasAttribute("data-beta")).toBe(true);
      expect(tag.textContent).toBe("Beta");
      const fs = await vi.importActual<typeof import("node:fs")>("node:fs");
      const css = fs.readFileSync("app/components/WebNav.module.css", "utf8");
      expect(css).toMatch(/\.navBeta \{ display: none/);
      expect(css).toMatch(/html\.lp-m\) [^{]*\.navBeta \{ display: inline-flex/);
    });
  }
});
