import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TrackListeners from "../app/components/TrackListeners";
import WebMenu from "../app/components/WebMenu";
import { track } from "../lib/track";

let mockPath = "/";
vi.mock("next/navigation", () => ({ usePathname: () => mockPath }));

type W = { dataLayer?: unknown[]; heap?: unknown };
const w = window as unknown as W;

let observers: { cb: IntersectionObserverCallback; disconnect: ReturnType<typeof vi.fn> }[] = [];
beforeEach(() => {
  mockPath = "/";
  delete w.dataLayer;
  delete w.heap;
  document.documentElement.lang = "ar";
  observers = [];
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  vi.stubGlobal("IntersectionObserver", class {
    disconnect = vi.fn();
    constructor(cb: IntersectionObserverCallback) { observers.push({ cb, disconnect: this.disconnect }); }
    observe() {}
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("track", () => {
  it("creates dataLayer and does not throw with no heap", () => {
    expect(() => track("menu_open", {})).not.toThrow();
    expect(w.dataLayer).toHaveLength(1);
  });
  it("does not throw when heap.track throws", () => {
    w.heap = { track: () => { throw new Error("boom"); } };
    expect(() => track("menu_open", {})).not.toThrow();
  });
  it("pushes event, params and locale, and mirrors to heap", () => {
    const heapTrack = vi.fn();
    w.heap = { track: heapTrack };
    track("cta_click", { cta_id: "join_waitlist", placement: "hero" });
    expect(w.dataLayer).toEqual([{ event: "cta_click", cta_id: "join_waitlist", placement: "hero", locale: "ar" }]);
    expect(heapTrack).toHaveBeenCalledWith("cta_click", { cta_id: "join_waitlist", placement: "hero", locale: "ar" });
  });
});

describe("TrackListeners", () => {
  it("pushes the locale on mount and on every pathname change", () => {
    const { rerender } = render(<TrackListeners />);
    expect(w.dataLayer).toEqual([{ locale: "ar" }]);
    mockPath = "/sellers";
    rerender(<TrackListeners />);
    expect(w.dataLayer).toEqual([{ locale: "ar" }, { locale: "ar" }]);
  });
  it("tracks a delegated cta_click and a locale_switch", () => {
    render(<><TrackListeners />
      <a href="#x" data-gp-track="cta_click" data-gp-cta-id="for_sellers" data-gp-placement="nav"><span>Sellers</span></a>
      <a href="#y" data-gp-track="locale_switch" data-gp-from="ar" data-gp-to="en">English</a>
      <a href="#z" data-gp-track="cta_click" data-gp-cta-id="Bad Id" data-gp-placement="nav">bad</a></>);
    w.dataLayer = [];
    fireEvent.click(screen.getByText("Sellers"));
    fireEvent.click(screen.getByText("English"));
    fireEvent.click(screen.getByText("bad"));
    expect(w.dataLayer).toEqual([
      { event: "cta_click", cta_id: "for_sellers", placement: "nav", locale: "ar" },
      { event: "locale_switch", from: "ar", to: "en", locale: "ar" },
    ]);
  });
  it("fires section_view once per pathname and again after navigation", () => {
    const { rerender } = render(<TrackListeners />);
    const entry = { isIntersecting: true, intersectionRatio: 0.6, target: document.createElement("section") };
    entry.target.setAttribute("data-gp-section", "features");
    const fire = () => act(() => observers.at(-1)!.cb([entry, entry] as never, {} as never));
    const views = () => (w.dataLayer as { event?: string }[]).filter((e) => e.event === "section_view");
    fire();
    expect(views()).toEqual([{ event: "section_view", section_id: "features", locale: "ar" }]);
    fire();
    expect(views()).toHaveLength(1);
    mockPath = "/sellers";
    rerender(<TrackListeners />);
    expect(observers[0].disconnect).toHaveBeenCalled();
    fire();
    expect(views()).toHaveLength(2);
  });
});

describe("TrackListeners gating and cleanup", () => {
  const views = () => ((w.dataLayer ?? []) as { event?: string }[]).filter((e) => e.event === "section_view");
  const sectionEntry = (o: object) => {
    const target = document.createElement("section");
    target.setAttribute("data-gp-section", "faq");
    return { target, isIntersecting: true, intersectionRatio: 0, intersectionRect: { height: 0 }, ...o };
  };
  const fire = (o: object) => act(() => observers.at(-1)!.cb([sectionEntry(o)] as never, {} as never));

  it("ignores a short section at ratio 0.3", () => {
    render(<TrackListeners />);
    fire({ intersectionRatio: 0.3, intersectionRect: { height: 10 } });
    expect(views()).toHaveLength(0);
  });
  it("counts a tall section once half a viewport shows", () => {
    render(<TrackListeners />);
    fire({ intersectionRatio: 0.1, intersectionRect: { height: window.innerHeight / 2 + 1 } });
    expect(views()).toHaveLength(1);
  });
  it("ignores entries that are not intersecting", () => {
    render(<TrackListeners />);
    fire({ isIntersecting: false, intersectionRatio: 0.9, intersectionRect: { height: 9999 } });
    expect(views()).toHaveLength(0);
  });
  it("maps store_click and drops unknown stores", () => {
    render(<><TrackListeners />
      <a href="#a" data-gp-track="store_click" data-gp-store="play" data-gp-placement="hero">play</a>
      <a href="#b" data-gp-track="store_click" data-gp-store="huawei" data-gp-placement="hero">huawei</a></>);
    w.dataLayer = [];
    fireEvent.click(screen.getByText("play"));
    fireEvent.click(screen.getByText("huawei"));
    expect(w.dataLayer).toEqual([{ event: "store_click", store: "play", placement: "hero", locale: "ar" }]);
  });
  it("removes the click listener on unmount", () => {
    const { unmount } = render(<><TrackListeners />
      <a href="#a" data-gp-track="cta_click" data-gp-cta-id="terms" data-gp-placement="footer">t</a></>);
    const link = screen.getByText("t");
    unmount();
    document.body.appendChild(link);
    w.dataLayer = [];
    fireEvent.click(link);
    expect(w.dataLayer).toEqual([]);
  });
});

describe("WebMenu", () => {
  it("pushes menu_open when opened", () => {
    render(<WebMenu locale="en" />);
    fireEvent.click(screen.getByRole("button"));
    expect((w.dataLayer as { event?: string }[]).filter((e) => e.event === "menu_open")).toHaveLength(1);
  });
  it("does not push menu_open when closing", () => {
    render(<WebMenu locale="en" />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect((w.dataLayer as { event?: string }[]).filter((e) => e.event === "menu_open")).toHaveLength(1);
  });
});
