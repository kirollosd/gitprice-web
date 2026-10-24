import { cleanup, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

vi.mock("next/script", () => ({ default: () => null }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

const mockEnv = (launch: boolean) =>
  vi.doMock("../lib/env", () => ({
    env: { launch, chromeStoreUrl: "https://c.test", appStoreUrl: "https://a.test", playStoreUrl: "https://p.test", tallyFormId: "mYLGEG" },
  }));

afterEach(() => {
  cleanup();
  vi.doUnmock("../lib/env");
  vi.resetModules();
});

const F = en.web.home.features;
const item = (key: string) => document.querySelector(`[data-feature="${key}"]`) as HTMLElement;

describe("Home GP-372 sections", () => {
  for (const launch of [true, false]) {
    it(`renders baseline, feature rows and grouped rows (launch=${launch})`, async () => {
      mockEnv(launch);
      const { default: HomeContent } = await import("../app/components/HomeSections");
      render(<HomeContent locale="en" />);
      for (const b of Object.values(en.web.home.baseline)) {
        expect(screen.getByText(b.title)).toBeTruthy();
        expect(screen.getByText(b.body)).toBeTruthy();
      }
      expect(screen.getByRole("heading", { name: F.heading })).toBeTruthy();
      for (const k of ["rows", "alerts", "history"] as const) expect(screen.getByRole("heading", { name: F[k].title })).toBeTruthy();
      for (const g of Object.values(F.groups)) expect(screen.getByRole("heading", { name: g })).toBeTruthy();
    });
  }

  it("tags the right items and gives priceHistory a note, not a tag", async () => {
    mockEnv(true);
    const { default: HomeContent, GROUPS } = await import("../app/components/HomeSections");
    render(<HomeContent locale="en" />);
    const soon = ["emailAlerts", "phoneAlerts", "sync", "suggestStore"];
    const all = GROUPS.flat().flatMap((g) => g.items.map((i) => i.key));
    expect(all).toHaveLength(13);
    for (const key of all) {
      const el = item(key);
      expect(within(el).getByRole("heading", { level: 4 }).textContent).toBe((F as unknown as Record<string, { title: string }>)[key].title);
      const tag = el.querySelector("span")?.textContent ?? null;
      expect(tag).toBe(soon.includes(key) ? F.tag.soon : key === "proLimits" ? F.tag.pro : null);
    }
    expect(within(item("priceHistory")).getByText(F.priceHistory.pro)).toBeTruthy();
    expect(document.querySelectorAll("[data-feature] p").length).toBe(all.length + 1);
  });

  it("hides every art block from assistive tech", async () => {
    mockEnv(true);
    const { default: HomeContent } = await import("../app/components/HomeSections");
    render(<HomeContent locale="ar" />);
    const art = [...document.querySelectorAll("[data-art]")];
    expect(art.map((a) => a.getAttribute("data-art"))).toEqual(["hero", "rows", "alerts", "history"]);
    art.forEach((a) => expect(a.getAttribute("aria-hidden")).toBe("true"));
    expect(screen.getByText(ar.web.home.baseline.languages.title)).toBeTruthy();
  });
});

describe("Sellers", () => {
  it("renders features 1 to 7 and the rival art, aria-hidden", async () => {
    mockEnv(false);
    const { default: SellersPage } = await import("../app/[locale]/sellers/page");
    render(await SellersPage({ params: Promise.resolve({ locale: "en" }) }));
    const S = en.web.sellers.features as unknown as Record<string, { title: string; body: string }>;
    for (let n = 1; n <= 7; n++) {
      expect(screen.getByRole("heading", { name: S[n].title })).toBeTruthy();
      expect(screen.getByText(S[n].body)).toBeTruthy();
    }
    const rivals = document.querySelector('[data-art="rivals"]');
    expect(rivals?.getAttribute("aria-hidden")).toBe("true");
    expect(rivals?.querySelectorAll("li")).toHaveLength(3);
  });
});
