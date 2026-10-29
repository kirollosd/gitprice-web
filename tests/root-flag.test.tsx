import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useRootFlag } from "../app/landing/rootFlag";

describe("useRootFlag (one coral CTA flags)", () => {
  it("mirrors the state on <html> and clears it on unmount", () => {
    const root = document.documentElement;
    const { rerender, unmount } = renderHook(({ on }) => useRootFlag("data-x", on), { initialProps: { on: true } });
    expect(root.hasAttribute("data-x")).toBe(true);
    rerender({ on: false });
    expect(root.hasAttribute("data-x")).toBe(false);
    rerender({ on: true });
    unmount();
    expect(root.hasAttribute("data-x")).toBe(false);
  });
});
