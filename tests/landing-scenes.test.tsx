import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Locale } from "../lib/i18n";

function stubMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: reduce && q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
}

async function mount(locale: Locale, sections: ("Hero" | "Print" | "Spot")[]) {
  const { getProduct, localize } = await import("../app/landing/products");
  const { default: ScrollScenes } = await import("../app/landing/ScrollScenes");
  const P = localize(getProduct(), locale);
  const parts = await Promise.all(sections.map(async (n) => (await import(`../app/landing/${n}`)).default));
  return render(
    <div>
      {parts.map((C, i) => <C key={i} locale={locale} product={P} />)}
      <ScrollScenes locale={locale} />
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
});
