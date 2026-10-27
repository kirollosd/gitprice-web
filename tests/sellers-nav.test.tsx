import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

const mockEnv = (sellersNav: boolean) =>
  vi.doMock("../lib/env", () => ({ env: { launch: false, sellersNav, siteUrl: "http://localhost:3000" } }));

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  vi.doUnmock("../lib/env");
  vi.resetModules();
});

// The Coral header (GP-406) has no menu sheet: the toggle is one header link beside the landing links.
async function renderNav() {
  window.matchMedia = ((q: string) => ({ matches: /768/.test(q), addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  const { default: WebNav } = await import("../app/components/WebNav");
  render(<WebNav locale="en" variant="site" />);
  return [...screen.getByRole("navigation").querySelectorAll("a")].map((a) => a.getAttribute("href"));
}

describe("NEXT_PUBLIC_SELLERS_NAV", () => {
  it("off: no sellers toggle in the header nav", async () => {
    mockEnv(false);
    const hrefs = await renderNav();
    expect(hrefs).not.toContain("/sellers");
    expect(hrefs).toHaveLength(5);
  });

  it("on: the toggle shows once in the header nav", async () => {
    mockEnv(true);
    const hrefs = await renderNav();
    expect(hrefs.filter((h) => h === "/sellers")).toHaveLength(1);
  });
});
