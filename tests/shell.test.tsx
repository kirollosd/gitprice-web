import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isHostedPath, switchPath } from "../lib/locale";

let mockPath = "/";
vi.mock("next/navigation", () => ({ usePathname: () => mockPath }));

// Controllable matchMedia: tests flip `viewport` and fire change listeners.
let viewport = 390;
const listeners = new Map<string, Set<() => void>>();
const matches = (q: string) => viewport >= Number(/min-width:\s*(\d+)px/.exec(q)![1]);
beforeEach(() => {
  viewport = 390;
  listeners.clear();
  window.matchMedia = ((q: string) => ({
    get matches() { return matches(q); },
    addEventListener: (_: string, cb: () => void) => { (listeners.get(q) ?? listeners.set(q, new Set()).get(q)!).add(cb); },
    removeEventListener: (_: string, cb: () => void) => listeners.get(q)?.delete(cb),
  })) as unknown as typeof window.matchMedia;
});
const resizeTo = (w: number) => act(() => { viewport = w; listeners.forEach((set) => set.forEach((cb) => cb())); });

describe("isHostedPath", () => {
  it("matches whole hosted segments only", () => {
    for (const p of ["/reset-password", "/checkout", "/checkout/return"]) expect(isHostedPath(p)).toBe(true);
    for (const p of ["/checkoutx", "/", "/sellers", "/reset-passwords"]) expect(isHostedPath(p)).toBe(false);
  });
});

describe("switchPath", () => {
  it("keeps the hash on regular pages", () => {
    expect(switchPath("/sellers", "#faq", "ar")).toBe("/ar/sellers#faq");
  });
  it("drops the hash on hosted pages", () => {
    expect(switchPath("/checkout", "#code=abc", "ar")).toBe("/ar/checkout");
    expect(switchPath("/checkout/return", "#code=abc", "ar")).toBe("/ar/checkout/return");
    expect(switchPath("/ar/reset-password", "#access_token=x", "en")).toBe("/reset-password");
  });
  it("only treats whole path segments as locale or hosted", () => {
    expect(switchPath("/arabic", "", "ar")).toBe("/ar/arabic");
    expect(switchPath("/sellers/", "#x", "ar")).toBe("/ar/sellers/#x");
    expect(switchPath("/ar/", "", "en")).toBe("/");
    expect(switchPath("/checkoutx", "#x", "ar")).toBe("/ar/checkoutx#x");
  });
  it("switches back to English from /ar", () => {
    expect(switchPath("/ar", "", "en")).toBe("/");
    expect(switchPath("/ar/sellers", "#faq", "en")).toBe("/sellers#faq");
  });
});

describe("WebMenu", () => {
  afterEach(() => { cleanup(); document.body.style.overflow = ""; });
  const setup = async () => {
    const { default: WebMenu } = await import("../app/components/WebMenu");
    render(<WebMenu locale="en" />);
    return screen.getByRole("button", { name: "Open menu" });
  };

  it("toggles aria-expanded, and aria-controls only exists while open", async () => {
    const btn = await setup();
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(btn.hasAttribute("aria-controls")).toBe(false);
    fireEvent.click(btn);
    const open = screen.getByRole("button", { name: "Close menu" });
    expect(open.getAttribute("aria-expanded")).toBe("true");
    expect(open.getAttribute("aria-controls")).toBe("web-menu");
    expect(document.getElementById("web-menu")).toBeTruthy();
  });

  it("moves focus to the first link on open and labels the list nav", async () => {
    const btn = await setup();
    fireEvent.click(btn);
    const links = screen.getAllByRole("link");
    expect(document.activeElement).toBe(links[0]);
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeTruthy();
  });

  it("Escape closes and returns focus to the button even when focus moved elsewhere", async () => {
    const btn = await setup();
    fireEvent.click(btn);
    (screen.getAllByRole("link")[2] as HTMLElement).focus();
    fireEvent.keyDown(document, { key: "Escape" });
    const closed = screen.getByRole("button", { name: "Open menu" });
    expect(closed.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(closed);
  });

  it("clicking the button again closes it and focuses the button", async () => {
    const btn = await setup();
    fireEvent.click(btn);
    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expect(document.getElementById("web-menu")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Open menu" }));
  });

  it("locks body scroll while open and restores it after", async () => {
    const btn = await setup();
    document.body.style.overflow = "auto";
    fireEvent.click(btn);
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.body.style.overflow).toBe("auto");
  });

  it("wraps Tab between the button and the overlay links", async () => {
    const btn = await setup();
    fireEvent.click(btn);
    const links = screen.getAllByRole("link");
    const toggle = screen.getByRole("button", { name: "Close menu" });
    links[links.length - 1].focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(toggle);
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(links[0]);
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(toggle);
  });

  it("closes when the viewport grows to 1024 or more", async () => {
    const btn = await setup();
    fireEvent.click(btn);
    resizeTo(1024);
    expect(screen.getByRole("button", { name: "Open menu" }).getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById("web-menu")).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });
});

describe("WebNav hosted", () => {
  afterEach(cleanup);
  it("shows only the logo linking to / and no menu button", async () => {
    const { default: WebNav } = await import("../app/components/WebNav");
    render(<WebNav locale="ar" variant="hosted" />);
    const links = screen.getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["/"]);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("navigation")).toBeNull();
  });
  it("picks the hosted variant itself on a hosted path in either locale", async () => {
    const { default: WebNav } = await import("../app/components/WebNav");
    for (const path of ["/ar/reset-password", "/checkout/return"]) {
      mockPath = path;
      const { unmount } = render(<WebNav locale={path.startsWith("/ar") ? "ar" : "en"} />);
      expect(screen.queryByRole("navigation")).toBeNull();
      expect(screen.queryByRole("button")).toBeNull();
      unmount();
    }
    mockPath = "/";
  });
  it("hides the footer on hosted paths", async () => {
    const { default: HideOnHosted } = await import("../app/components/HideOnHosted");
    mockPath = "/ar/reset-password";
    const { unmount } = render(<HideOnHosted><p>footer</p></HideOnHosted>);
    expect(screen.queryByText("footer")).toBeNull();
    unmount();
    mockPath = "/ar/sellers";
    render(<HideOnHosted><p>footer</p></HideOnHosted>);
    expect(screen.getByText("footer")).toBeTruthy();
    mockPath = "/";
  });
});
