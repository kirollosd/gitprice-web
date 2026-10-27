import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: () => {}, push: () => {} }), useSearchParams: () => new URLSearchParams(), usePathname: () => "/" }));

const mockEnv = (sellersNav: boolean) =>
  vi.doMock("../lib/env", () => ({ env: { launch: false, sellersNav, siteUrl: "http://localhost:3000" } }));

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  vi.doUnmock("../lib/env");
  vi.resetModules();
});

async function renderNavWithMenuOpen() {
  window.matchMedia = ((q: string) => ({ matches: /768/.test(q), addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  const { default: WebNav } = await import("../app/components/WebNav");
  render(<WebNav locale="en" variant="site" />);
  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
  return [...document.querySelectorAll("a")].map((a) => a.getAttribute("href"));
}

describe("NEXT_PUBLIC_SELLERS_NAV", () => {
  it("off: no sellers toggle in the header nav or the menu sheet", async () => {
    mockEnv(false);
    const hrefs = await renderNavWithMenuOpen();
    expect(hrefs).not.toContain("/sellers");
    expect(document.querySelector("#web-menu")).not.toBeNull();
  });

  it("on: the toggle shows in the header (all four width sets) and the menu sheet", async () => {
    mockEnv(true);
    const hrefs = await renderNavWithMenuOpen();
    expect(hrefs.filter((h) => h === "/sellers")).toHaveLength(5);
  });
});
