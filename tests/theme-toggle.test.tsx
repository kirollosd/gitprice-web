import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ThemeToggle from "../app/components/ThemeToggle";

let osDark = false;
const root = document.documentElement;

beforeEach(() => {
  osDark = false;
  delete root.dataset.theme;
  localStorage.clear();
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("dark") && osDark, media: q, addEventListener: () => {}, removeEventListener: () => {} }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("ThemeToggle", () => {
  it("light effective: offers dark, stores it and sets data-theme=dark", () => {
    render(<ThemeToggle locale="en" />);
    const b = screen.getByRole("button", { name: "Switch to dark" });
    // The label names the action and flips, so no aria-pressed (a pressed state on a flipping name contradicts itself).
    expect(b.hasAttribute("aria-pressed")).toBe(false);
    fireEvent.click(b);
    expect(root.dataset.theme).toBe("dark");
    expect(localStorage.getItem("gp-theme")).toBe("dark");
    expect(screen.getByRole("button", { name: "Switch to light" }).hasAttribute("aria-pressed")).toBe(false);
  });
  it("OS dark with no stored choice: offers light and sets data-theme=light", () => {
    osDark = true;
    render(<ThemeToggle locale="en" />);
    const b = screen.getByRole("button", { name: "Switch to light" });
    fireEvent.click(b);
    expect(root.dataset.theme).toBe("light");
    expect(localStorage.getItem("gp-theme")).toBe("light");
  });
  it("an explicit data-theme beats the OS", () => {
    osDark = true;
    root.dataset.theme = "light";
    render(<ThemeToggle locale="ar" />);
    expect(screen.getByRole("button", { name: "الوضع الداكن" })).toBeTruthy();
  });
  it("survives localStorage throwing", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    render(<ThemeToggle locale="en" />);
    act(() => { fireEvent.click(screen.getByRole("button")); });
    expect(root.dataset.theme).toBe("dark");
  });
});
