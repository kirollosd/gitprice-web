import { cleanup, render, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "../i18n/en.json";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));
vi.mock("../lib/env", () => ({ env: { launch: false, chromeStoreUrl: "https://c.test" } }));

afterEach(cleanup);
const S = en.web.component.webPricingCard.sellersRow;

describe("Pricing (no-prices board)", () => {
  it("shows the Free 0 and the sellers row linking to /sellers", async () => {
    const { default: PricingPage } = await import("../app/[locale]/pricing/page");
    const { container } = render(await PricingPage({ params: Promise.resolve({ locale: "en" }) }));
    const [free] = container.querySelectorAll("article");
    expect(free.querySelector("p")!.textContent).toBe("0");
    expect(container.querySelector("article ul")).toBeNull(); // no feature lists or limits
    const row = container.querySelector("aside")!;
    expect(within(row).getByRole("heading").textContent).toBe(S.title);
    expect(within(row).getByRole("link", { name: S.cta.label }).getAttribute("href")).toBe("/sellers");
  });

  it("links the Arabic sellers row to /ar/sellers", async () => {
    const { default: PricingPage } = await import("../app/[locale]/pricing/page");
    const { container } = render(await PricingPage({ params: Promise.resolve({ locale: "ar" }) }));
    expect(container.querySelector("aside a")!.getAttribute("href")).toBe("/ar/sellers");
  });
});
