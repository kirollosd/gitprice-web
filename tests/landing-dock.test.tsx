import { act, cleanup, fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../i18n/en.json";
import { stubMotion } from "./landing-stubs";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

const CHROME = "https://chromewebstore.test/gitprice";
const mockEnv = (launch: boolean) =>
  vi.doMock("../lib/env", () => ({
    env: { launch, apiBaseUrl: "http://localhost:8080", chromeStoreUrl: CHROME, appStoreUrl: "https://a.test", playStoreUrl: "https://p.test" },
  }));

beforeEach(() => { stubMotion(true); vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] }); });
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.doUnmock("../lib/env");
  vi.resetModules();
  delete document.documentElement.dataset.gpJoin;
  history.replaceState(null, "", "/");
});

/** The layout's order: provider around everything, the page in <main>, the dock after it. */
async function page(launch = false) {
  mockEnv(launch);
  const { default: HomeContent } = await import("../app/components/HomeSections");
  const { default: Dock, JoinProvider } = await import("../app/landing/Dock");
  return render(
    <JoinProvider>
      <main id="main"><HomeContent locale="en" /></main>
      <Dock locale="en" />
    </JoinProvider>,
  );
}
const dock = () => document.getElementById("dock")!;
const heroJoin = () => document.querySelector('[data-join][data-gp-placement="hero"]') as HTMLElement;

describe("Dock", () => {
  it("with motion on, the dock stays hidden until the board has landed (but opens with the form)", async () => {
    stubMotion(false);
    await page();
    expect(document.getElementById("num")!.hasAttribute("data-landed")).toBe(false);
    expect(dock().classList.contains("in")).toBe(false);
    act(() => { fireEvent.click(heroJoin()); });
    expect(dock().classList.contains("in")).toBe(true);
  });

  it("a hero Join the waitlist focuses the dock's email field and hides the scroll cue", async () => {
    await page();
    act(() => { fireEvent.click(heroJoin()); });
    const input = dock().querySelector('input[type="email"]');
    expect(input).toBeTruthy();
    expect(document.activeElement).toBe(input);
    expect(dock().classList.contains("in")).toBe(true);
    expect(document.documentElement.dataset.gpJoin).toBe("open");
  });

  it("the Beta tag stays in the dock while its form is open", async () => {
    await page();
    expect(dock().querySelector("[data-beta]")).toBeTruthy();
    act(() => { fireEvent.click(heroJoin()); });
    expect(dock().querySelector('input[type="email"]')).toBeTruthy();
    expect(dock().querySelectorAll("[data-beta]")).toHaveLength(1);
  });

  it("a #join URL no longer opens anything: every Join button opens the form in place instead", async () => {
    location.hash = "#join";
    await page();
    expect(dock().querySelector('input[type="email"]')).toBeNull();
    history.replaceState(null, "", "/");
  });

  it("Escape closes the form and returns focus to the button that opened it", async () => {
    await page();
    act(() => { fireEvent.click(heroJoin()); });
    act(() => { fireEvent.keyDown(dock(), { key: "Escape" }); });
    expect(dock().querySelector('input[type="email"]')).toBeNull();
    expect(document.activeElement).toBe(heroJoin());
    expect(document.documentElement.dataset.gpJoin).toBeUndefined();
  });

  it("Escape closes the open form from anywhere on the page, and the open dock is a named group", async () => {
    await page();
    expect(dock().getAttribute("role")).toBeNull();
    act(() => { fireEvent.click(heroJoin()); });
    expect(dock().getAttribute("role")).toBe("group");
    expect(dock().getAttribute("aria-label")).toBe(en.web.landing.dock.join);
    act(() => { fireEvent.keyDown(document.body, { key: "Escape" }); });
    expect(dock().querySelector('input[type="email"]')).toBeNull();
    expect(dock().getAttribute("role")).toBeNull();
  });

  it("an Escape another popup already handled does not also close the form", async () => {
    await page();
    act(() => { fireEvent.click(heroJoin()); });
    const stop = (e: Event) => e.preventDefault();
    document.addEventListener("keydown", stop, true);
    act(() => { fireEvent.keyDown(document.body, { key: "Escape" }); });
    document.removeEventListener("keydown", stop, true);
    expect(dock().querySelector('input[type="email"]')).toBeTruthy();
  });

  it("after joining, pressing a Join button moves focus to the announced confirmation instead of doing nothing", async () => {
    await page();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: { status: "created" } }), { status: 201, headers: { "content-type": "application/json" } })));
    vi.useRealTimers();
    act(() => { fireEvent.click(heroJoin()); });
    const input = dock().querySelector('input[type="email"]') as HTMLInputElement;
    act(() => { fireEvent.change(input, { target: { value: "a@b.co" } }); });
    await act(async () => { fireEvent.submit(input.closest("form")!); });
    await vi.waitFor(() => expect(document.getElementById("dt")?.getAttribute("aria-live")).toBe("polite"));
    (document.activeElement as HTMLElement)?.blur();
    act(() => { fireEvent.click(heroJoin()); });
    expect(document.activeElement).toBe(document.getElementById("dt"));
  });

  it("comes in once the hero board has landed and then stays, wherever the visitor is (the mock's dockIn)", async () => {
    await page();
    expect(dock().classList.contains("in")).toBe(true);
    // over the rail and the footer it is still there
    document.getElementById("foot")!.getBoundingClientRect = () => ({ top: 10, bottom: 900 } as DOMRect);
    act(() => { dispatchEvent(new Event("scroll")); vi.advanceTimersToNextFrame(); });
    expect(dock().classList.contains("in")).toBe(true);
    expect(document.getElementById("dt")!.textContent).toBe(en.web.landing.dock.foot);
  });

  it("comes after <main> in document and tab order", async () => {
    await page();
    const main = document.querySelector("main")!;
    expect(main.compareDocumentPosition(dock()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(main.contains(dock())).toBe(false);
  });

  it("launch: no form anywhere, the Chrome link in the dock and in place of every join button", async () => {
    await page(true);
    expect(document.querySelector("form")).toBeNull();
    expect(document.querySelector("[data-join]")).toBeNull();
    expect(dock().querySelector(`a[href="${CHROME}"]`)).toBeTruthy();
    const hero = document.querySelector(`#num a[href="${CHROME}"]`), foot = document.querySelector(`#foot a[href="${CHROME}"]`);
    expect(hero?.getAttribute("data-gp-placement")).toBe("hero");
    expect(foot?.getAttribute("data-gp-placement")).toBe("bottom");
  });

  it("names the section the visitor is in, or the price elsewhere at the top", async () => {
    await page();
    const text = () => document.getElementById("dt")!.textContent;
    expect(text()).toContain("412.00");
    const film = document.getElementById("film")!;
    film.getBoundingClientRect = () => ({ top: 10, bottom: 900 } as DOMRect);
    act(() => { dispatchEvent(new Event("scroll")); vi.advanceTimersToNextFrame(); });
    expect(text()).toBe(en.web.landing.dock.film);
  });

  it("coalesces a burst of scroll events into one layout pass per frame", async () => {
    await page();
    const spy = vi.spyOn(document.getElementById("film")!, "getBoundingClientRect");
    const frame = (events: number) => {
      spy.mockClear();
      act(() => { for (let i = 0; i < events; i++) dispatchEvent(new Event("scroll")); });
      expect(spy).not.toHaveBeenCalled();
      act(() => { vi.advanceTimersToNextFrame(); });
      return spy.mock.calls.length;
    };
    const one = frame(1);
    expect(one).toBeGreaterThan(0);
    expect(frame(20)).toBe(one);
  });

  it("the scenes mark the board as landed once the hero has played (reduced motion: at once)", async () => {
    await page();
    expect(document.getElementById("num")!.hasAttribute("data-landed")).toBe(true);
    expect(dock().classList.contains("in")).toBe(true);
  });

  it("on a site page the dock is simply there, with the waitlist and no landing data", async () => {
    vi.doMock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }), useSearchParams: () => new URLSearchParams(), usePathname: () => "/sellers" }));
    mockEnv(false);
    const { default: Dock, JoinProvider } = await import("../app/landing/Dock");
    render(<JoinProvider><main id="main" /><Dock locale="en" /></JoinProvider>);
    expect(dock().classList.contains("in")).toBe(true);
    expect(document.getElementById("dt")!.textContent).toBe(en.web.landing.dock.foot);
    act(() => { fireEvent.click(document.getElementById("dgo")!); });
    expect(document.activeElement).toBe(dock().querySelector('input[type="email"]'));
    vi.doUnmock("next/navigation");
  });

  it.each(["/reset-password", "/checkout", "/welcome", "/ar/welcome"])("hosted page %s has no dock", async (path) => {
    vi.doMock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }), useSearchParams: () => new URLSearchParams(), usePathname: () => path }));
    mockEnv(false);
    const { default: Dock, JoinProvider } = await import("../app/landing/Dock");
    render(<JoinProvider><main id="main" /><Dock locale="en" /></JoinProvider>);
    expect(document.getElementById("dgo")).toBeNull();
    vi.doUnmock("next/navigation");
  });
});
