import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const URL = "https://t.me/gitprice_deals";
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: () => {}, push: () => {} }), useSearchParams: () => new URLSearchParams(), usePathname: () => "/privacy" }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));
vi.mock("../app/components/CookieNotice", () => ({ CookieSettingsButton: () => null }));
const mockEnv = (telegramChannelUrl?: string) =>
  vi.doMock("../lib/env", () => ({ env: { launch: false, sellersNav: false, siteUrl: "http://localhost:3000", telegramChannelUrl } }));

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  vi.doUnmock("../lib/env");
  vi.resetModules();
});

const channelLinks = () => [...document.querySelectorAll(`a[href="${URL}"]`)];

describe("deals channel link", () => {
  it("site footer: Stores always; channel link only when the URL is set", async () => {
    mockEnv(undefined);
    let { default: WebFooter } = await import("../app/components/WebFooter");
    render(<WebFooter locale="en" />);
    expect(screen.getByRole("link", { name: "Stores" }).getAttribute("href")).toBe("/stores");
    expect(channelLinks()).toHaveLength(0);
    expect(document.querySelector('a[href="/deals"]')).toBeNull();
    cleanup();
    vi.resetModules();
    mockEnv(URL);
    ({ default: WebFooter } = await import("../app/components/WebFooter"));
    render(<WebFooter locale="ar" />);
    expect(screen.getByRole("link", { name: "المتاجر" }).getAttribute("href")).toBe("/ar/stores");
    const [a] = channelLinks();
    expect(a.textContent).toBe("انضم إلى قناة العروض");
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toBe("noopener");
    expect(screen.getByRole("link", { name: "العروض" }).getAttribute("href")).toBe("/ar/deals");
  });

  it("menu sheet shows the channel link when set", async () => {
    mockEnv(URL);
    window.matchMedia = ((q: string) => ({ matches: /768/.test(q), addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    const { default: WebNav } = await import("../app/components/WebNav");
    render(<WebNav locale="en" variant="site" />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(document.querySelector(`#web-menu a[href="${URL}"]`)?.textContent).toBe("Join our deals channel");
    expect(document.querySelector('#web-menu a[href="/deals"]')?.textContent).toBe("Deals");
  });

  it("landing footer (home) carries Stores and the channel link", async () => {
    mockEnv(URL);
    const { default: Foot } = await import("../app/landing/Foot");
    const { products } = await import("../app/landing/products");
    render(<Foot locale="en" product={products[0]} />);
    expect(document.querySelector('footer#foot a[href="/stores"]')).not.toBeNull();
    expect(document.querySelectorAll(`footer#foot a[href="${URL}"]`)).toHaveLength(1);
    expect(document.querySelectorAll('footer#foot a[href="/deals"]')).toHaveLength(1);
  });
});
