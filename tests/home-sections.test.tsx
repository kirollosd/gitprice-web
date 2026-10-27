import { cleanup, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

vi.mock("next/script", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

const mockEnv = (launch: boolean) =>
  vi.doMock("../lib/env", () => ({
    env: { launch, chromeStoreUrl: "https://c.test", appStoreUrl: "https://a.test", playStoreUrl: "https://p.test" },
  }));

// the landing picks a random product on load; 0 is the charger these tests read
beforeEach(() => { vi.spyOn(Math, "random").mockReturnValue(0); });
afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  vi.doUnmock("../lib/env");
  vi.resetModules();
});

const L = { en: en.web.landing, ar: ar.web.landing };
const IDS = ["num", "how", "film", "spot", "rcpt", "rail", "foot"];
const BANNED = ["Amazon", "Noon", "Jumia", "Egypt", "مصر", "ج.م"];
// The launch date, not any month name: a receipt dated November is fine.
const LAUNCH = /\b(13\s*Nov|Nov(ember)?\s*13|6\s*Nov|Nov(ember)?\s*6)\b|(13|6)\s*نوفمبر|نوفمبر\s*(13|6)/i;
const guardHits = (root: HTMLElement) => textNodes(root).filter((s) => BANNED.some((b) => s.includes(b)) || LAUNCH.test(s));

async function renderHome(locale: "en" | "ar") {
  mockEnv(false);
  const { default: HomeContent } = await import("../app/components/HomeSections");
  return render(<HomeContent locale={locale} />);
}

const textNodes = (root: Node) => {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const out: string[] = [];
  while (w.nextNode()) out.push(w.currentNode.textContent ?? "");
  return out;
};

describe("Coral landing sections", () => {

  for (const locale of ["en", "ar"] as const) {
    it(`renders each nav anchor section once, tagged for analytics (${locale})`, async () => {
      await renderHome(locale);
      for (const id of IDS) {
        const els = document.querySelectorAll(`#${id}`);
        expect(els, id).toHaveLength(1);
        expect(els[0].getAttribute("data-gp-section")).toBe(id);
      }
      expect(document.querySelector("#alerts")?.getAttribute("data-gp-section")).toBe("alerts");
    });

    it(`uses the landing headline as the only h1 (${locale})`, async () => {
      await renderHome(locale);
      const h1 = screen.getAllByRole("heading", { level: 1 });
      expect(h1).toHaveLength(1);
      expect(h1[0].textContent).toBe(L[locale].hero.headline);
    });

    it(`names no store, country or launch date in any text node (${locale})`, async () => {
      const { container } = await renderHome(locale);
      expect(guardHits(container)).toEqual([]);
    });

    it(`shows the free line from the ship critique (${locale})`, async () => {
      await renderHome(locale);
      expect(screen.getByText(L[locale].hero.free)).toBeTruthy();
    });
  }

  it("dates the receipt in #rmonth and a November build still passes the launch-date guard", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-13T12:00:00Z") });
    try {
      const { container } = await renderHome("en");
      expect(container.querySelector("#paper #rmonth")?.textContent).toBe("November 2026");
      expect(guardHits(container)).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("guard catches launch-date phrasing", () => {
    for (const s of ["Launching 13 Nov", "November 6", "Nov 13th? no: Nov 13", "يوم 13 نوفمبر"]) expect(LAUNCH.test(s)).toBe(true);
    expect(LAUNCH.test("Your month · November 2026 · example cart")).toBe(false);
  });

  it("hides the ≠ glyph in trap reasons and names the room heading", async () => {
    const { container } = await renderHome("en");
    const ems = [...container.querySelectorAll("#rank em")];
    expect(ems.length).toBeGreaterThan(0);
    ems.forEach((em) => expect(em.querySelector('[aria-hidden="true"]')?.textContent?.trim()).toBe("≠"));
    expect(container.querySelector("#room h2#roomh")).toBeTruthy();
    expect(container.querySelector("#h1")).toBeNull();
  });

  it("rolls the charger hero from 699 to 412, whole numbers only", async () => {
    await renderHome("en");
    const digits = document.querySelector("#digits") as HTMLElement;
    expect(digits.dataset.from).toBe("699");
    expect(digits.dataset.to).toBe("412");
    const sr = document.querySelector("#numsr")?.textContent ?? "";
    expect(sr).toContain("699");
    expect(sr).toContain("412");
    expect(sr).not.toMatch(/699\.00|412\.00/);
  });

  it("marks every example price with its ISO code", async () => {
    await renderHome("en");
    const prices = [...document.querySelectorAll("[data-egp]")];
    expect(prices.length).toBeGreaterThan(10);
    for (const p of prices) expect(p.nextElementSibling?.textContent).toBe("EGP");
  });

  it("draws store marks as labelled images, never names", async () => {
    await renderHome("ar");
    const marks = [...document.querySelectorAll('i[role="img"]')];
    expect(marks.length).toBeGreaterThan(0);
    for (const m of marks) expect([L.ar.store.circle, L.ar.store.triangle, L.ar.store.square]).toContain(m.getAttribute("aria-label"));
  });

  it("gives every join button a data-join hook", async () => {
    await renderHome("en");
    const join = [...document.querySelectorAll("button[data-join]")];
    expect(join.length).toBe(2);
    join.forEach((b) => expect(b.getAttribute("type")).toBe("button"));
  });
});

describe("products", () => {
  it("falls back to the first product for an unknown id", async () => {
    const { getProduct, products } = await import("../app/landing/products");
    expect(getProduct("nope").id).toBe("charger");
    expect(getProduct().id).toBe("charger");
    expect(getProduct("iphone").id).toBe("iphone");
    expect(products.map((p) => p.id)).toEqual(["charger", "iphone", "cerave", "airfryer", "pampers"]);
  });

  it("carries Arabic for every demo string", async () => {
    const { products, localize } = await import("../app/landing/products");
    const cer = localize(products.find((p) => p.id === "cerave")!, "ar");
    expect(cer.chip).toBe("عناية بالبشرة");
    expect(cer.tags).toEqual(["= نفس التركيبة", "= نفس الحجم 454g"]);
    expect(cer.lineup[3][5]).toBe("عبوة من 2");
    expect(localize(products[4], "ar").lookalike.label).toBe("■ Store · 44 حفاضة");
    expect(localize(products[0], "en").chip).toBe("Phone charger");
  });
});

describe("html()", () => {
  it("escapes variables and passes trusted fragments through", async () => {
    const { html } = await import("../app/landing/html");
    const out = html("en", "web.landing.hero.captionStart", { product: '<img src=x onerror="1">' }).__html;
    expect(out).toContain("&lt;img src=x onerror=&quot;1&quot;&gt;");
    expect(out).toContain("<b>");
    expect(html("en", "web.landing.spot.note", {}, { marks: "<i></i>" }).__html).toContain("<i></i> are made-up");
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
    expect(within(rivals as HTMLElement).getAllByText(en.web.sellers.visual.rival.pinned)).toHaveLength(3);
  });

  it("shows the seller waitlist note once, inside the form, before launch only", async () => {
    const note = en.web.sellers.prelaunch.hero.waitlist.note;
    mockEnv(false);
    let { default: SellersPage } = await import("../app/[locale]/sellers/page");
    render(await SellersPage({ params: Promise.resolve({ locale: "en" }) }));
    expect(within(document.querySelector("#waitlist") as HTMLElement).getAllByText(note)).toHaveLength(1);
    expect(document.querySelector("#waitlist")?.nextElementSibling).toBeNull();
    cleanup();
    vi.doUnmock("../lib/env");
    vi.resetModules();
    mockEnv(true);
    ({ default: SellersPage } = await import("../app/[locale]/sellers/page"));
    render(await SellersPage({ params: Promise.resolve({ locale: "en" }) }));
    expect(document.querySelector("#waitlist")?.nextElementSibling).toBeNull();
  });
});
