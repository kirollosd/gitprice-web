import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../i18n/en.json";
import { intersect, stubMotion } from "./landing-stubs";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

beforeEach(() => stubMotion(false));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete document.documentElement.dataset.theme;
  document.documentElement.classList.remove("lp-m");
});

async function section(name: "Alerts" | "Film", id = "charger") {
  const { getProduct, localize } = await import("../app/landing/products");
  const { default: C } = await import(`../app/landing/${name}`);
  const P = localize(getProduct(id), "en");
  render(<C locale="en" product={P} />);
  return P;
}

describe("AlertSlider", () => {
  it("is a slider bounded by the product's weekly prices; arrows move it and the toast follows", async () => {
    const P = await section("Alerts");
    const slider = screen.getByRole("slider", { name: en.web.landing.alerts.sliderLabel });
    const lo = Math.min(...P.weeks), hi = Math.max(...P.weeks), pad = (hi - lo) * 0.3;
    expect(Number(slider.getAttribute("aria-valuemin"))).toBe(Math.round(lo - pad + 10));
    expect(Number(slider.getAttribute("aria-valuemax"))).toBe(Math.round(hi + pad * 0.6 - 10));
    expect(Number(slider.getAttribute("aria-valuenow"))).toBe(P.alert);
    expect(slider.getAttribute("aria-valuetext")).toMatch(/ EGP$/);
    expect(slider.querySelectorAll("circle")).toHaveLength(P.weeks.length);
    act(() => { fireEvent.keyDown(slider, { key: "PageUp" }); });
    expect(Number(slider.getAttribute("aria-valuenow"))).toBeGreaterThan(P.alert);
    act(() => { for (let i = 0; i < 40; i++) fireEvent.keyDown(slider, { key: "ArrowDown" }); });
    expect(Number(slider.getAttribute("aria-valuenow"))).toBe(Number(slider.getAttribute("aria-valuemin")));
    expect(document.getElementById("tt")!.textContent).toBe(en.web.landing.alerts.none);
  });

  it("Home and End jump to the ends of the range", async () => {
    await section("Alerts");
    const slider = screen.getByRole("slider");
    act(() => { fireEvent.keyDown(slider, { key: "End" }); });
    expect(slider.getAttribute("aria-valuenow")).toBe(slider.getAttribute("aria-valuemax"));
    act(() => { fireEvent.keyDown(slider, { key: "Home" }); });
    expect(slider.getAttribute("aria-valuenow")).toBe(slider.getAttribute("aria-valuemin"));
  });

  it("a key press inside the 400 ms before the first-view sweep cancels the sweep", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    try {
      await section("Alerts");
      const slider = screen.getByRole("slider");
      act(() => { intersect(slider.parentElement!); });
      act(() => { fireEvent.keyDown(slider, { key: "End" }); });
      const picked = slider.getAttribute("aria-valuenow");
      act(() => { vi.advanceTimersByTime(4000); });
      expect(slider.getAttribute("aria-valuenow")).toBe(picked);
    } finally {
      vi.useRealTimers();
    }
  });

  it("Any drop counts the drops and drops the line", async () => {
    const P = await section("Alerts");
    act(() => { fireEvent.click(document.querySelector('#rules [data-r="any"]')!); });
    const drops = P.weeks.filter((v, i) => i > 0 && v < P.weeks[i - 1]).length;
    expect(document.getElementById("tt")!.textContent).toMatch(new RegExp(`^${drops} drops\\.`));
    expect(document.querySelector("#csvg line")).toBeNull();
    expect(document.querySelector('#rules [data-r="any"]')!.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("DemoVideo", () => {
  const vid = () => document.getElementById("vid") as HTMLVideoElement;
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  });

  it("loads nothing until the film is in view, then the light cut; a theme change swaps the source", async () => {
    await section("Film");
    expect(vid().getAttribute("preload")).toBe("none");
    expect(vid().getAttribute("src")).toBeNull();
    act(() => intersect(document.getElementById("film")!));
    expect(vid().getAttribute("src")).toBe("/media/demo-charger-coral-light.mp4");
    expect(vid().getAttribute("poster")).toBe("/media/demo-charger-coral-light-poster.jpg");
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    document.documentElement.dataset.theme = "dark";
    await act(async () => { await Promise.resolve(); });
    expect(vid().getAttribute("src")).toBe("/media/demo-charger-coral.mp4");
  });

  it("phones get the 4:5 cut; out of view it pauses", async () => {
    document.documentElement.classList.add("lp-m");
    await section("Film", "iphone");
    act(() => intersect(document.getElementById("film")!));
    expect(vid().getAttribute("src")).toBe("/media/demo-iphone-m-coral-light.mp4");
    act(() => intersect(document.getElementById("film")!, false));
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });
});

describe("WebNav (landing)", () => {
  it("has the board wordmark, the five landing links, the language menu, the theme toggle and the join CTA", async () => {
    const { default: WebNav } = await import("../app/components/WebNav");
    render(<WebNav locale="en" variant="landing" />);
    const N = en.web.landing.nav;
    const nav = screen.getByRole("navigation");
    const links = [...nav.querySelectorAll("a")].map((a) => [a.textContent, a.getAttribute("href")]);
    expect(links).toEqual([[N.howItWorks, "/#how"], [N.watchLive, "/#film"], [N.matchChallenge, "/#spot"], [N.savings, "/#rcpt"], [N.stores, "/#rail"]]);
    expect(screen.getByRole("link", { name: N.home }).querySelector("svg")).toBeTruthy();
    expect(screen.getByRole("button", { name: en.web.landing.lang.label })).toBeTruthy();
    expect(screen.getByRole("button", { name: en.web.landing.theme.toDark })).toBeTruthy();
    const cta = document.querySelector('header [data-join][data-gp-placement="nav"]');
    expect(cta?.textContent).toBe(N.join);
  });
});

describe("WebNav (site, non-home pages)", () => {
  it("keeps the phone menu button and no landing wordmark/dock CTA", async () => {
    window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    const { default: WebNav } = await import("../app/components/WebNav");
    render(<WebNav locale="en" variant="site" />);
    expect(screen.getByRole("button", { name: "Open menu" })).toBeTruthy();
    expect(document.querySelector("[data-join]")).toBeNull();
  });

  it("is picked by default off the home route", async () => {
    window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    vi.doMock("next/navigation", () => ({ usePathname: () => "/sellers", useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), useSearchParams: () => new URLSearchParams() }));
    vi.resetModules();
    const { default: WebNav } = await import("../app/components/WebNav");
    render(<WebNav locale="en" />);
    expect(screen.getByRole("button", { name: "Open menu" })).toBeTruthy();
    vi.doUnmock("next/navigation");
    vi.resetModules();
  });
});

describe("Wordmark first paint", () => {
  it("the theme boot marks <html> as scripted, and the CSS arms the board only then and only with motion allowed", async () => {
    const { THEME_BOOT } = await import("../lib/theme");
    document.documentElement.classList.remove("js");
    new Function(THEME_BOOT)();
    expect(document.documentElement.classList.contains("js")).toBe(true);
    const fs = await vi.importActual<typeof import("node:fs")>("node:fs");
    const css = fs.readFileSync("app/landing/Wordmark.module.css", "utf8");
    expect(css).toMatch(/@media \(prefers-reduced-motion: no-preference\)\s*\{\s*:global\(html\.js\) \.logo:not\(\[data-board="go"\]\) \.L \{ transform: translateY\(420px\); \}/);
  });
});
