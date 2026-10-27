import { cleanup, fireEvent, render } from "@testing-library/react";
import { readdirSync, readFileSync } from "node:fs";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

let launch = false;
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: () => {}, push: () => {} }), useSearchParams: () => new URLSearchParams(), usePathname: () => (globalThis as { __path?: string }).__path ?? "/pricing" }));
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

const bySet = (ids: string[]) => [...ids].sort();
// header: the landing's five section links; menu sheet: How it works. The waitlist CTAs are not links: they open the dock in place (owner, 2026-10-27)
const EXPECTED = ["film", "how", "how", "rail", "rcpt", "spot"];

describe("links into the landing", () => {
  for (const locale of ["en", "ar"] as const) {
    for (const isLaunch of [false, true]) {
      it(`${locale} launch=${isLaunch}: from /pricing, header, menu sheet and pricing target exactly the expected landing ids`, async () => {
        launch = isLaunch;
        (globalThis as { __path?: string }).__path = locale === "ar" ? "/ar/pricing" : "/pricing";
        window.matchMedia = ((q: string) => ({ matches: /768/.test(q), addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
        const { default: WebNav } = await import("../app/components/WebNav");
        render(<WebNav locale={locale} variant="site" />);
        fireEvent.click(document.querySelector("button[aria-expanded]:not(#lng)")!);
        const { default: PricingPage } = await import("../app/[locale]/pricing/page");
        render(await PricingPage({ params: Promise.resolve({ locale }) }));
        const hrefs = [...document.querySelectorAll("a")].map((a) => a.getAttribute("href"));
        const ids = homeAnchors(hrefs, locale);
        expect(bySet(ids)).toEqual(EXPECTED);
        for (const id of ids) expect(landingIds, `#${id}`).toContain(id);
        // there is no separate Features item: nothing else points at #how twice per surface
        const how = hrefs.filter((h) => h?.endsWith("#how"));
        expect(how).toHaveLength(2); // one header link, one menu link
        if (isLaunch) expect(hrefs).toContain("https://c.test");
        else {
          expect(hrefs.some((h) => h?.includes("#join"))).toBe(false);
          // header, menu sheet and the pricing page's two plan CTAs
          expect(document.querySelectorAll("button[data-join]")).toHaveLength(4);
        }
      });
    }
  }

  it("the landing has the ids the links rely on", () => {
    for (const id of ["how", "foot"]) expect(landingIds).toContain(id);
  });
});
