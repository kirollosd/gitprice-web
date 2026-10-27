import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); document.documentElement.style.removeProperty("--gp-stack-h"); document.documentElement.style.removeProperty("--gp-stack-w"); delete document.documentElement.dataset.gpStack; document.documentElement.dir = ""; });

describe("FloatingStack", () => {
  it("publishes its height as --gp-stack-h so the dock can lift above the cookie notice", async () => {
    let fire: () => void = () => {};
    vi.stubGlobal("ResizeObserver", class { constructor(cb: () => void) { fire = cb; } observe() {} disconnect() {} });
    const { default: FloatingStack } = await import("../app/components/FloatingStack");
    const { container, unmount } = render(<FloatingStack><p>notice</p></FloatingStack>);
    vi.spyOn(container.firstElementChild as HTMLElement, "offsetHeight", "get").mockReturnValue(180);
    act(() => fire());
    expect(document.documentElement.style.getPropertyValue("--gp-stack-h")).toBe("180px");
    unmount();
    expect(document.documentElement.style.getPropertyValue("--gp-stack-h")).toBe("");
  });

  it("the dock lifts by that height with a transform (a late notice is no layout shift)", async () => {
    const fs = await vi.importActual<typeof import("node:fs")>("node:fs");
    const css = fs.readFileSync("app/landing/Dock.module.css", "utf8");
    expect(css).toMatch(/\.in\) \{ transform: translateY\(calc\(var\(--gp-stack-h, 0px\) \* -1\)\)/);
    expect(css).not.toMatch(/bottom: calc\([^)]*--gp-stack-h/);
  });

  const reach = async (right: number, rtl = false) => {
    let fire: () => void = () => {};
    vi.stubGlobal("ResizeObserver", class { constructor(cb: () => void) { fire = cb; } observe() {} disconnect() {} });
    const { default: FloatingStack } = await import("../app/components/FloatingStack");
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    const { container } = render(<FloatingStack><p>notice</p></FloatingStack>);
    const stack = container.firstElementChild as HTMLElement;
    const card = stack.firstElementChild as HTMLElement;
    vi.spyOn(stack, "clientWidth", "get").mockReturnValue(1440);
    vi.spyOn(card, "getBoundingClientRect").mockReturnValue(rtl ? ({ left: 1440 - right, right: 1440 } as DOMRect) : ({ left: 0, right } as DOMRect));
    act(() => fire());
    return document.documentElement;
  };

  it("a card at the inline start (cookie notice) is 'side': it publishes how far it reaches in, LTR and RTL", async () => {
    const root = await reach(416);
    expect(root.style.getPropertyValue("--gp-stack-w")).toBe("416px");
    expect(root.dataset.gpStack).toBe("side");
    cleanup();
    const rtl = await reach(416, true);
    expect(rtl.style.getPropertyValue("--gp-stack-w")).toBe("416px");
    expect(rtl.dataset.gpStack).toBe("side");
  });

  it("a wide banner (locale suggestion) is 'full', so the dock lifts instead", async () => {
    expect((await reach(1200)).dataset.gpStack).toBe("full");
  });

  it("desktop dock offsets inline-start of the card (logical, centred in the free space); narrower widths lift", async () => {
    const fs = await vi.importActual<typeof import("node:fs")>("node:fs");
    const css = fs.readFileSync("app/landing/Dock.module.css", "utf8");
    expect(css).toMatch(/@media \(min-width: 1280px\) \{[^}]*html\[data-gp-stack="side"\]\) \.dock \{ inset-inline: calc\(var\(--gp-stack-w, 0px\) \+ 16px\) 24px; margin-inline: auto/);
    expect(css).toMatch(/html\[data-gp-stack\]\) \.dock:global\(\.in\) \{ transform: translateX\(-50%\) translateY\(calc\(var\(--gp-stack-h/);
  });
});
