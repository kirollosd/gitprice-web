import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../i18n/en.json";
import { intersect, stubMotion } from "./landing-stubs";

const R = en.web.landing.room;
const ROW_H = 40;

beforeEach(() => {
  stubMotion(true);
  // jsdom has no layout: every rank row is 40px tall
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(ROW_H);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

async function spot() {
  const { getProduct, localize } = await import("../app/landing/products");
  const { default: Spot } = await import("../app/landing/Spot");
  return render(<Spot locale="en" product={localize(getProduct("charger"), "en")} />);
}
const rows = () => [...document.querySelectorAll("#rank > div")] as HTMLElement[];
const y = (el: HTMLElement) => Number(/translateY\((-?[\d.]+)px\)/.exec(el.style.transform)?.[1]);

describe("RankSort", () => {
  it("after Sorted by price, then Sorted by GitPrice, exactly one row is first and it is the top one", async () => {
    await spot();
    act(() => { fireEvent.click(document.getElementById("tgAll")!); });
    act(() => { fireEvent.click(document.getElementById("tgGp")!); });
    const first = rows().filter((r) => r.classList.contains("first"));
    expect(first).toHaveLength(1);
    expect(y(first[0])).toBe(0);
    expect(Math.min(...rows().map(y))).toBe(0);
    // GitPrice order: exact matches before look-alikes, and the top row is an exact match
    expect(first[0].hasAttribute("data-exact")).toBe(true);
    expect(document.getElementById("tgGp")!.getAttribute("aria-pressed")).toBe("true");
    expect(document.getElementById("tgAll")!.getAttribute("aria-pressed")).toBe("false");
    expect(document.getElementById("rank")!.style.height).toBe(`${rows().length * ROW_H}px`);
  });

  it("price order puts the cheapest look-alike on top", async () => {
    await spot();
    act(() => { fireEvent.click(document.getElementById("tgAll")!); });
    const top = rows().find((r) => y(r) === 0)!;
    expect(top.classList.contains("first")).toBe(true);
    expect(top.hasAttribute("data-exact")).toBe(false);
    expect(rows().filter((r) => r.classList.contains("x"))).toHaveLength(0);
  });

  it("flips to GitPrice order once the ranking scrolls into view", async () => {
    vi.useFakeTimers();
    await spot();
    act(() => { intersect(document.getElementById("rank")!); vi.runAllTimers(); });
    expect(document.getElementById("tgGp")!.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("RankSort manual choice", () => {
  it("a manual toggle before the auto-flip cancels it", async () => {
    vi.useFakeTimers();
    await spot();
    act(() => { intersect(document.getElementById("rank")!); });
    act(() => { fireEvent.click(document.getElementById("tgAll")!); vi.runAllTimers(); });
    expect(document.getElementById("tgAll")!.getAttribute("aria-pressed")).toBe("true");
  });

  it("a manual toggle before the ranking is in view keeps the observer from flipping later", async () => {
    vi.useFakeTimers();
    await spot();
    act(() => { fireEvent.click(document.getElementById("tgAll")!); });
    act(() => { intersect(document.getElementById("rank")!); vi.runAllTimers(); });
    expect(document.getElementById("tgAll")!.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("Lineup", () => {
  it("guessing the exact card stamps it Same product, says Right, and stops the scroll scrub", async () => {
    vi.useFakeTimers();
    await spot();
    const exact = document.querySelector("#sus [data-exact]") as HTMLElement;
    act(() => { fireEvent.click(exact); vi.runAllTimers(); });
    expect(document.getElementById("spotpin")!.hasAttribute("data-manual")).toBe(true);
    expect(exact.classList.contains("rev")).toBe(true);
    expect(exact.classList.contains("out")).toBe(false);
    expect(exact.textContent).toContain(R.stamp);
    expect(document.getElementById("verdict")!.classList.contains("on")).toBe(true);
    expect(document.getElementById("verdict")!.textContent).toMatch(/^Right\./);
    expect(document.getElementById("roomh")!.textContent).toBe(R.right);
    const others = [...document.querySelectorAll("#sus > button:not([data-exact])")];
    others.forEach((b) => expect(b.classList.contains("out")).toBe(true));
  });

  it("a wrong guess names the reason; Show me reveals without a lead", async () => {
    vi.useFakeTimers();
    await spot();
    const wrong = document.querySelector("#sus > button:not([data-exact])") as HTMLElement;
    act(() => { fireEvent.click(wrong); vi.runAllTimers(); });
    expect(document.getElementById("verdict")!.textContent).toMatch(/^Not quite: /);
    expect(document.getElementById("roomh")!.textContent).toBe(R.wrong.replace(/<\/?em>/g, ""));
    act(() => { fireEvent.click(document.getElementById("next")!); vi.runAllTimers(); });
    act(() => { fireEvent.click(document.getElementById("reveal")!); vi.runAllTimers(); });
    expect(document.getElementById("verdict")!.textContent).toMatch(/^The exact one/);
  });

  it("Next advances the lineup to the following products, then offers Start over", async () => {
    vi.useFakeTimers();
    const { products } = await import("../app/landing/products");
    await spot();
    const next = document.getElementById("next")!;
    act(() => { fireEvent.click(next); vi.runAllTimers(); });
    expect(document.getElementById("refname")!.textContent).toBe(products[1].name);
    expect([...document.querySelectorAll("#dots i")].map((d) => d.classList.contains("on"))).toEqual([false, true, false]);
    expect([...document.querySelectorAll("#sus > button")].every((b) => b.classList.contains("in"))).toBe(true);
    expect(document.getElementById("verdict")!.classList.contains("on")).toBe(false);
    act(() => { fireEvent.click(next); vi.runAllTimers(); });
    expect(document.getElementById("refname")!.textContent).toBe(products[2].name);
    expect(next.textContent).toBe(R.startOver);
    act(() => { fireEvent.click(next); vi.runAllTimers(); });
    expect(document.getElementById("refname")!.textContent).toBe(products[0].name);
    expect(next.textContent).toBe(R.next);
  });
});
