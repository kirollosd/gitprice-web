import { cleanup, fireEvent, render } from "@testing-library/react";
import { readdirSync, readFileSync } from "node:fs";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

let launch = false;
vi.mock("next/navigation", () => ({ usePathname: () => "/sellers" }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));
vi.mock("../lib/env", () => ({
  env: { get launch() { return launch; }, chromeStoreUrl: "https://c.test", sellersNav: true, siteUrl: "http://localhost:3000" },
}));

afterEach(cleanup);

/** Every id="x" literal in the landing sources: the anchors a /#x link can land on. */
const landingIds = new Set(
  readdirSync("app/landing")
    .filter((f) => f.endsWith(".tsx"))
    .flatMap((f) => [...readFileSync(`app/landing/${f}`, "utf8").matchAll(/\bid="([\w-]+)"/g)].map((m) => m[1])),
);
const homeAnchors = (hrefs: (string | null)[], locale: string) =>
  hrefs.filter((h): h is string => !!h && h.startsWith(locale === "ar" ? "/ar#" : "/#")).map((h) => h.split("#")[1]);

describe("links into the landing", () => {
  for (const locale of ["en", "ar"] as const) {
    for (const isLaunch of [false, true]) {
      it(`${locale} launch=${isLaunch}: header, menu sheet and pricing only target ids the landing has`, async () => {
        launch = isLaunch;
        window.matchMedia = ((q: string) => ({ matches: /768/.test(q), addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
        const { default: WebNav } = await import("../app/components/WebNav");
        render(<WebNav locale={locale} variant="site" />);
        fireEvent.click(document.querySelector("button[aria-expanded]")!);
        const { default: PricingPage } = await import("../app/[locale]/pricing/page");
        render(await PricingPage({ params: Promise.resolve({ locale }) }));
        const ids = homeAnchors([...document.querySelectorAll("a")].map((a) => a.getAttribute("href")), locale);
        expect(ids.length).toBeGreaterThan(0);
        for (const id of ids) expect(landingIds, `#${id}`).toContain(id);
      });
    }
  }

  it("the landing has the ids the links rely on", () => {
    for (const id of ["how", "foot"]) expect(landingIds).toContain(id);
  });
});
