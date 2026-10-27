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

  it("the dock never moves for the notice: no lift, no side offset; the stack rises above it instead", async () => {
    const fs = await vi.importActual<typeof import("node:fs")>("node:fs");
    const dock = fs.readFileSync("app/landing/Dock.module.css", "utf8");
    expect(dock).not.toMatch(/--gp-stack/);
    expect(dock).not.toMatch(/data-gp-stack/);
    const stack = fs.readFileSync("app/components/FloatingStack.module.css", "utf8");
    expect(stack).toMatch(/html:has\(#dock\.in\)\) \.stack \{ inset-block-end: calc\(var\(--gp-dock-h, 0px\) \+ 28px\)/);
  });

  it("flags html[data-gp-stack] while a notice shows, and clears it when empty or unmounted", async () => {
    let fire: () => void = () => {};
    vi.stubGlobal("ResizeObserver", class { constructor(cb: () => void) { fire = cb; } observe() {} disconnect() {} });
    const { default: FloatingStack } = await import("../app/components/FloatingStack");
    const { unmount } = render(<FloatingStack><p>notice</p></FloatingStack>);
    act(() => fire());
    expect(document.documentElement.dataset.gpStack).toBe("");
    unmount();
    expect(document.documentElement.dataset.gpStack).toBeUndefined();
  });
});
