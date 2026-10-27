import { act, cleanup, fireEvent, render } from "@testing-library/react";
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
  it("a hero Join the waitlist focuses the dock's email field and hides the scroll cue", async () => {
    await page();
    act(() => { fireEvent.click(heroJoin()); });
    const input = dock().querySelector('input[type="email"]');
    expect(input).toBeTruthy();
    expect(document.activeElement).toBe(input);
    expect(dock().classList.contains("in")).toBe(true);
    expect(document.documentElement.dataset.gpJoin).toBe("open");
  });

  it("Escape closes the form and returns focus to the button that opened it", async () => {
    await page();
    act(() => { fireEvent.click(heroJoin()); });
    act(() => { fireEvent.keyDown(dock(), { key: "Escape" }); });
    expect(dock().querySelector('input[type="email"]')).toBeNull();
    expect(document.activeElement).toBe(heroJoin());
    expect(document.documentElement.dataset.gpJoin).toBeUndefined();
  });

  it("is hidden while the hero CTA is in view and while #foot is in view", async () => {
    await page();
    const cta = heroJoin(), foot = document.getElementById("foot")!;
    expect(dock().classList.contains("in")).toBe(false);
    act(() => intersect(cta, false));
    expect(dock().classList.contains("in")).toBe(true);
    act(() => intersect(foot, true));
    expect(dock().classList.contains("in")).toBe(false);
    act(() => intersect(foot, false));
    expect(dock().classList.contains("in")).toBe(true);
    act(() => intersect(cta, true));
    expect(dock().classList.contains("in")).toBe(false);
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

  it("still hides at #foot after a product pick remounts it", async () => {
    await page();
    const old = document.getElementById("foot")!;
    const cta = heroJoin();
    act(() => intersect(cta, false));
    expect(dock().classList.contains("in")).toBe(true);
    const fresh = Object.assign(document.createElement("section"), { id: "foot" });
    old.replaceWith(fresh);
    act(() => { dispatchEvent(new Event("gp:product")); });
    act(() => intersect(fresh, true));
    expect(dock().classList.contains("in")).toBe(false);
  });
});
