import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

const ios: { cb: IntersectionObserverCallback; els: Element[] }[] = [];
function stubMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: reduce && q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      els: Element[] = [];
      constructor(cb: IntersectionObserverCallback) { ios.push({ cb, els: this.els }); }
      observe(el: Element) { this.els.push(el); }
      unobserve() {}
      disconnect() {}
    },
  );
}
const intersect = (el: Element, on = true) =>
  ios.filter((o) => o.els.includes(el)).forEach((o) => o.cb([{ target: el, isIntersecting: on } as IntersectionObserverEntry], {} as IntersectionObserver));

beforeEach(() => { ios.length = 0; });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("GMark", () => {
  it('state="ne" renders the slash, settled', async () => {
    stubMotion(false);
    const { default: GMark } = await import("../app/landing/GMark");
    const { container } = render(<GMark state="ne" label="Not the same" />);
    const g = container.querySelector("[data-g]")!;
    expect(g.getAttribute("data-g")).toBe("ne");
    expect(g.querySelector("path[data-p=slash]")).toBeTruthy();
    expect(g.querySelector("path[data-p=flag]")?.getAttribute("d")).toBe("M-80 18L80 18");
  });

  it("settleOnView with reduced motion settles with no timer", async () => {
    stubMotion(true);
    vi.useFakeTimers();
    const { default: GMark } = await import("../app/landing/GMark");
    const { container } = render(<GMark state="same" settleOnView label="Same product" />);
    const g = container.querySelector("[data-g]")!;
    expect(g.getAttribute("data-g")).toBe("same");
    expect(g.querySelector("path[data-p=smile]")?.getAttribute("d")).toBe("M-80 98Q0 98 80 98");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("settleOnView checks first, then settles 900 ms after it scrolls into view", async () => {
    stubMotion(false);
    vi.useFakeTimers();
    const { default: GMark } = await import("../app/landing/GMark");
    const { container } = render(<GMark state="same" settleOnView label="Same product" />);
    const g = container.querySelector("[data-g]")!;
    expect(g.getAttribute("data-g")).toBe("chk");
    act(() => intersect(g));
    act(() => { vi.advanceTimersByTime(899); });
    expect(g.getAttribute("data-g")).toBe("chk");
    act(() => { vi.advanceTimersByTime(1); });
    expect(g.getAttribute("data-g")).toBe("same");
  });

  it("names itself with the label; the glyph is hidden", async () => {
    stubMotion(false);
    const { default: GMark } = await import("../app/landing/GMark");
    const { container } = render(<GMark state="none" label="No exact match" />);
    expect(screen.getByRole("img", { name: "No exact match" })).toBeTruthy();
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("an empty label makes it decorative", async () => {
    stubMotion(false);
    const { default: GMark } = await import("../app/landing/GMark");
    const { container } = render(<GMark state="idle" label="" />);
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
    expect(container.firstElementChild?.getAttribute("role")).toBeNull();
  });
});

describe("Wordmark", () => {
  it("groups the 21 logo paths into the 8 price-board letters and plays on mount", async () => {
    stubMotion(false);
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
    const { default: Wordmark } = await import("../app/landing/Wordmark");
    const { container } = render(<Wordmark locale="en" />);
    const svg = container.querySelector("svg")!;
    const groups = svg.querySelectorAll(":scope > g");
    expect(groups).toHaveLength(8);
    expect([...groups].map((g) => g.querySelectorAll("path").length)).toEqual([3, 2, 3, 3, 3, 2, 1, 4]);
    act(() => { vi.advanceTimersToNextFrame(); });
    expect(svg.dataset.board).toBe("go");
    expect(screen.getByRole("link").getAttribute("aria-label")).toBeTruthy();
  });

  it("replays when #foot comes into view", async () => {
    stubMotion(false);
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
    const foot = document.body.appendChild(Object.assign(document.createElement("section"), { id: "foot" }));
    const { default: Wordmark } = await import("../app/landing/Wordmark");
    const { container } = render(<Wordmark locale="en" />);
    const svg = container.querySelector("svg")!;
    act(() => { vi.advanceTimersToNextFrame(); });
    act(() => intersect(foot));
    expect(svg.dataset.board).toBe("");
    act(() => { vi.advanceTimersToNextFrame(); });
    expect(svg.dataset.board).toBe("go");
    foot.remove();
  });

  it("applies no animation under reduced motion", async () => {
    stubMotion(true);
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
    const { default: Wordmark } = await import("../app/landing/Wordmark");
    const { container } = render(<Wordmark locale="en" />);
    act(() => { vi.advanceTimersToNextFrame(); });
    const svg = container.querySelector("svg")!;
    expect(svg.dataset.board).toBeUndefined();
  });
});
