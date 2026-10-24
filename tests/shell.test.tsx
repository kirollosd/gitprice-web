import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { switchPath } from "../lib/locale";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("switchPath", () => {
  it("keeps the hash on regular pages", () => {
    expect(switchPath("/sellers", "#faq", "ar")).toBe("/ar/sellers#faq");
  });
  it("drops the hash on hosted pages", () => {
    expect(switchPath("/checkout", "#code=abc", "ar")).toBe("/ar/checkout");
    expect(switchPath("/checkout/return", "#code=abc", "ar")).toBe("/ar/checkout/return");
    expect(switchPath("/ar/reset-password", "#access_token=x", "en")).toBe("/reset-password");
  });
  it("switches back to English from /ar", () => {
    expect(switchPath("/ar", "", "en")).toBe("/");
    expect(switchPath("/ar/sellers", "#faq", "en")).toBe("/sellers#faq");
  });
});

describe("WebMenu", () => {
  afterEach(cleanup);
  it("toggles aria-expanded, and Escape closes it and returns focus", async () => {
    const { default: WebMenu } = await import("../app/components/WebMenu");
    render(<WebMenu locale="en" />);
    const btn = screen.getByRole("button", { name: "Open menu" });
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(btn);
    expect(screen.getByRole("button", { name: "Close menu", expanded: true })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    const closed = screen.getByRole("button", { name: "Open menu" });
    expect(closed.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(closed);
  });
});
