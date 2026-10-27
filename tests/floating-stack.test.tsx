import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); document.documentElement.style.removeProperty("--gp-stack-h"); });

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
});
