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

async function home(launch: boolean, locale: "en" | "ar") {
  vi.doMock("../lib/env", () => ({ env: { launch, apiBaseUrl: "http://x", chromeStoreUrl: "https://c.test" } }));
  const { default: HomeContent } = await import("../app/components/HomeSections");
  const { default: Dock, JoinProvider } = await import("../app/landing/Dock");
  // the landing's own footer (Foot, inside #foot) carries the tag; the layout's WebFooter steps aside on home
  render(<JoinProvider><main><HomeContent locale={locale} /></main><Dock locale={locale} /></JoinProvider>);
}

describe.each([[false], [true]])("Beta tag (launch=%s)", (launch) => {
  for (const locale of ["en", "ar"] as const) {
    it(`${locale}: sits by the dock CTA and in the footer, not in the hero`, async () => {
      await home(launch, locale);
      expect(label("en")).toBe("Beta");
      // the owner's ruling: "Beta" in every locale, never translated
      expect(tags().map((b) => b.textContent)).toEqual(["Beta", "Beta"]);
      const [foot, dock] = tags();
      expect(document.querySelector("#num [data-beta]")).toBeNull();
      expect(dock.closest("#dock")).toBeTruthy();
      expect(foot.closest("footer#foot")).toBeTruthy();
      // always the Latin word, isolated left-to-right inside the Arabic page
      for (const b of [dock, foot]) { expect(b.getAttribute("dir")).toBe("ltr"); expect(b.getAttribute("lang")).toBe("en"); }
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

describe("Beta tag in the header", () => {
  for (const locale of ["en", "ar"] as const) {
    for (const variant of ["landing", "site"] as const) {
      it(`${locale} ${variant}: sits beside the logo`, async () => {
        vi.doMock("../lib/env", () => ({ env: { launch: false, apiBaseUrl: "http://x", chromeStoreUrl: "https://c.test", sellersNav: false } }));
        vi.doMock("../app/landing/LangMenu", () => ({ default: () => null }));
        const { default: WebNav } = await import("../app/components/WebNav");
        const { JoinProvider } = await import("../app/landing/Dock");
        render(<JoinProvider><WebNav locale={locale} variant={variant} /></JoinProvider>);
        const tag = document.querySelector<HTMLElement>("header [data-beta]")!;
        expect(tag.textContent).toBe("Beta");
        expect(tag.previousElementSibling?.querySelector("svg, img") ?? tag.previousElementSibling).toBeTruthy();
        expect(document.querySelectorAll("header [data-beta]")).toHaveLength(1);
      });
    }
  }
});
