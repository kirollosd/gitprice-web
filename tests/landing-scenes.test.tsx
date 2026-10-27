import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Locale } from "../lib/i18n";

function stubMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: reduce && q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
}

type Section = "Hero" | "How" | "Film" | "Print" | "Spot" | "Foot";
async function mount(locale: Locale, sections: Section[], scenes = true) {
  const { getProduct, localize } = await import("../app/landing/products");
  const { default: ScrollScenes } = await import("../app/landing/ScrollScenes");
  const P = localize(getProduct(), locale);
  const parts = await Promise.all(sections.map(async (n) => (await import(`../app/landing/${n}`)).default));
  return render(
    <div>
      {parts.map((C, i) => <C key={i} locale={locale} product={P} />)}
      {scenes && <ScrollScenes locale={locale} />}
    </div>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.documentElement.classList.remove("lp-m");
});

describe("ScrollScenes", () => {
  it.each([
    ["en", "January 2027"],
    ["ar", "يناير 2027"],
  ] as const)("dates the receipt with the visitor's month, Latin digits (%s)", async (locale, want) => {
    stubMotion(false);
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(2027, 0, 5, 12) });
    const { container } = await mount(locale, ["Print"]);
    expect(container.querySelector("#rmonth")?.textContent).toBe(want);
  });

  it("lands the hero digits on data-to under reduced motion", async () => {
    stubMotion(true);
    const { container } = await mount("en", ["Hero"]);
    const digits = container.querySelector("#digits") as HTMLElement;
    const to = digits.dataset.to!.padStart(digits.dataset.from!.length, " ");
    const cells = [...digits.querySelectorAll("i")] as HTMLElement[];
    expect(cells).toHaveLength(3);
    cells.forEach((c, k) => expect(c.style.transform).toBe(`translateY(-${to[k]}em)`));
    expect(container.querySelector("#cap")?.innerHTML).toBe(container.querySelector("#cap")?.getAttribute("data-done"));
  });

  it("on phones, plays an idle receipt to its first step after 1.2 s in view", async () => {
    stubMotion(false);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    document.documentElement.classList.add("lp-m");
    const { container } = await mount("en", ["Print"]);
    const sec = container.querySelector("#print") as HTMLElement;
    // below the top of the viewport (scroll progress 0) but on screen
    sec.getBoundingClientRect = () => ({ top: 300, bottom: 2000, left: 0, right: 430, width: 430, height: 1700, x: 0, y: 300, toJSON() {} });
    const copies = () => [...container.querySelectorAll("[data-copy] > div")].map((d) => d.classList.contains("on"));
    act(() => { window.dispatchEvent(new Event("scroll")); });
    act(() => { vi.advanceTimersByTime(1100); });
    expect(copies()).toEqual([true, false, false, false]);
    act(() => { vi.advanceTimersByTime(1500); });
    expect(copies()).toEqual([true, true, false, false]);
  });

  it("does not auto-play on desktop", async () => {
    stubMotion(false);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    const { container } = await mount("en", ["Print"]);
    const sec = container.querySelector("#print") as HTMLElement;
    sec.getBoundingClientRect = () => ({ top: 300, bottom: 2000, left: 0, right: 1440, width: 1440, height: 1700, x: 0, y: 300, toJSON() {} });
    act(() => { window.dispatchEvent(new Event("scroll")); });
    act(() => { vi.advanceTimersByTime(3000); });
    expect(container.querySelectorAll("[data-copy] > div.on")).toHaveLength(1);
  });

  it("frame() does every layout read before its first write", async () => {
    stubMotion(false);
    await mount("en", ["Hero", "How", "Film", "Spot", "Print", "Foot"], false);
    const { createScenes } = await import("../app/landing/scenes");
    const sc = createScenes(false, () => {});
    sc.frame(); // first frame builds the cached metrics
    const log: string[] = [];
    const rect = vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(() => { log.push("r"); return new DOMRect(0, 200, 100, 900); });
    const oh = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(() => { log.push("r"); return 1800; });
    const ot = vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(() => { log.push("r"); return 0; });
    const sp = CSSStyleDeclaration.prototype.setProperty;
    const set = vi.spyOn(CSSStyleDeclaration.prototype, "setProperty").mockImplementation(function (this: CSSStyleDeclaration, ...a) { log.push("w"); return sp.apply(this, a); });
    const tg = DOMTokenList.prototype.toggle;
    const tog = vi.spyOn(DOMTokenList.prototype, "toggle").mockImplementation(function (this: DOMTokenList, ...a) { log.push("w"); return tg.apply(this, a as [string, boolean?]); });
    sc.frame();
    sc.measure();
    sc.frame(); // a re-measured frame reads its metrics in the read phase too
    [rect, oh, ot, set, tog].forEach((x) => x.mockRestore());
    sc.stop();
    const frames = log.join("").split(/(?<=w)(?=r)/);
    expect(frames).toHaveLength(2);
    frames.forEach((f) => expect(f).toMatch(/^r+w+$/));
  });

  it("formats the tally through money.ts and repaints when Rates swaps the formatter", async () => {
    stubMotion(true);
    const { setMoneyFormat, formatMoney } = await import("../app/landing/money");
    expect(formatMoney(699)).toBe("699.00 EGP");
    expect(formatMoney(699, 0)).toBe("699 EGP");
    const { container } = await mount("en", ["Print"]);
    const tally = () => container.querySelector("#tallyN")?.textContent;
    expect(tally()).toBe("518.00EGP");
    act(() => setMoneyFormat((egp, d) => `${(egp * 0.02).toFixed(d)} USD`));
    await act(() => new Promise((r) => setTimeout(r, 50)));
    expect(tally()).toBe("10.36USD");
    act(() => setMoneyFormat(null));
  });
});
