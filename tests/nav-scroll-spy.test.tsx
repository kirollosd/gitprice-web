import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: () => {}, push: () => {} }), useSearchParams: () => new URLSearchParams(), usePathname: () => "/" }));
vi.mock("../lib/env", () => ({ env: { launch: false, sellersNav: false, siteUrl: "http://localhost:3000" } }));

type Cb = (es: Partial<IntersectionObserverEntry>[]) => void;
let fire: Cb = () => {};
// next/link prefetching observes links too: keep the nav's own observer (the one on the centre line)
class FakeIO {
  constructor(cb: Cb, opts?: IntersectionObserverInit) { if (opts?.rootMargin === "-50% 0px -50% 0px") fire = cb; }
  observe() {}
  unobserve() {}
  disconnect() {}
}

afterEach(() => { cleanup(); document.body.innerHTML = ""; });

describe("header scroll-spy", () => {
  it("marks only the link of the section crossing the viewport centre, none in the hero", async () => {
    vi.stubGlobal("IntersectionObserver", FakeIO);
    for (const id of ["how", "film", "spot", "rcpt"]) document.body.insertAdjacentHTML("beforeend", `<section id="${id}"></section>`);
    const { default: WebNav } = await import("../app/components/WebNav");
    render(<WebNav locale="en" variant="landing" />, { container: document.body.appendChild(document.createElement("div")) });
    const current = () => [...document.querySelectorAll('nav a[aria-current="true"]')].map((a) => a.getAttribute("href"));
    const el = (id: string) => document.getElementById(id)!;

    expect(current()).toEqual([]);
    act(() => fire([{ target: el("how"), isIntersecting: true }]));
    expect(current()).toEqual(["/#how"]);
    act(() => fire([{ target: el("how"), isIntersecting: false }, { target: el("spot"), isIntersecting: true }]));
    expect(current()).toEqual(["/#spot"]);
    // touching sections: the later one wins, still one link
    act(() => fire([{ target: el("rcpt"), isIntersecting: true }]));
    expect(current()).toEqual(["/#rcpt"]);
    act(() => fire([{ target: el("spot"), isIntersecting: false }, { target: el("rcpt"), isIntersecting: false }]));
    expect(current()).toEqual([]);
    vi.unstubAllGlobals();
  });
});

describe("header scroll-spy after a product switch", () => {
  it("re-observes the rebuilt sections on gp:product", async () => {
    const observed: Element[] = [];
    class IO { constructor(_cb: unknown, o?: IntersectionObserverInit) { if (o?.rootMargin !== "-50% 0px -50% 0px") this.observe = () => {}; } observe(el: Element) { observed.push(el); } unobserve() {} disconnect() {} }
    vi.stubGlobal("IntersectionObserver", IO);
    document.body.insertAdjacentHTML("beforeend", `<section id="how"></section>`);
    const { useActiveSection } = await import("../app/components/useActiveSection");
    const { renderHook } = await import("@testing-library/react");
    renderHook(() => useActiveSection(["how"]));
    const fresh = document.createElement("section");
    document.getElementById("how")!.replaceWith(fresh);
    fresh.id = "how";
    act(() => { dispatchEvent(new Event("gp:product")); });
    expect(observed.at(-1)).toBe(fresh);
    vi.unstubAllGlobals();
  });
});
