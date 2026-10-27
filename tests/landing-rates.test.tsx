import { act, cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubMotion } from "./landing-stubs";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

const realDTF = Intl.DateTimeFormat;
function inZone(timeZone: string) {
  vi.spyOn(Intl, "DateTimeFormat").mockImplementation(((...a: ConstructorParameters<typeof Intl.DateTimeFormat>) => {
    const f = new realDTF(...a);
    return Object.assign(Object.create(f), { resolvedOptions: () => ({ ...f.resolvedOptions(), timeZone }) });
  }) as unknown as typeof Intl.DateTimeFormat);
}

beforeEach(() => { stubMotion(true); localStorage.clear(); });
afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  (await import("../app/landing/money")).setMoneyFormat(null);
});

async function home() {
  const { default: HomeContent } = await import("../app/components/HomeSections");
  return render(<HomeContent locale="en" />);
}
const flush = () => act(async () => { for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0)); });

describe("Rates", () => {
  it("in America/New_York the hero shows USD; when both rate fetches reject, the built-in rates apply and nothing throws", async () => {
    inZone("America/New_York");
    const fetch = vi.fn().mockRejectedValue(new TypeError("offline"));
    vi.stubGlobal("fetch", fetch);
    const errors: unknown[] = [];
    const onErr = (e: PromiseRejectionEvent) => errors.push(e.reason);
    addEventListener("unhandledrejection", onErr);
    await home();
    await flush();
    removeEventListener("unhandledrejection", onErr);
    expect(errors).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(2);
    const { RATE_URLS } = await import("../app/landing/Rates");
    expect(fetch.mock.calls.map((c) => c[0])).toEqual(RATE_URLS);
    expect(document.querySelector("#num [data-cur]")?.textContent).toBe("USD");
    // 699 EGP at the built-in 0.0182: the board shows whole numbers
    expect((document.querySelector("#digits") as HTMLElement).dataset.from).toBe("13");
    const price = document.querySelector("#refpr [data-egp]")!;
    expect(price.textContent).toBe("12.72");
    expect(price.nextElementSibling?.textContent).toBe("USD");
    expect(price.closest('bdi[dir="ltr"]')?.textContent).toBe("12.72 USD");
    expect(localStorage.getItem("gp-rates")).toBeNull();
  });

  it("in Cairo prices stay in EGP", async () => {
    inZone("Africa/Cairo");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("x")));
    await home();
    await flush();
    expect(document.querySelector("#refpr [data-egp]")?.textContent).toBe("699.00");
    expect(document.querySelector("#num [data-cur]")?.textContent).toBe("EGP");
  });

  it("caches a valid fetched table for the next visit and uses a fresh cache on load", async () => {
    inZone("Asia/Dubai");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ egp: { aed: 0.07, usd: 0.02, eur: "x", gbp: -1 } }))));
    await home();
    await flush();
    const cached = JSON.parse(localStorage.getItem("gp-rates")!);
    expect(cached.r).toEqual({ AED: 0.07, USD: 0.02 });
    cleanup();
    await home();
    await flush();
    expect(document.querySelector("#refpr [data-egp]")?.textContent).toBe("48.93");
    expect(document.querySelector("#refpr [data-cur]")?.textContent).toBe("AED");
  });
});

describe("rates helpers", () => {
  it("picks the currency from ?cur=, then the time zone, then the browser region", async () => {
    const { pickCurrency } = await import("../app/landing/Rates");
    expect(pickCurrency("?cur=GBP", "Africa/Cairo", "en-US")).toBe("GBP");
    expect(pickCurrency("?cur=XYZ", "Africa/Cairo", "en-US")).toBe("EGP");
    expect(pickCurrency("?cur=gbp", "Africa/Cairo", "en-US")).toBe("GBP");
    for (const bad of ["constructor", "__proto__", "toString", "hasOwnProperty"]) expect(pickCurrency(`?cur=${bad}`, "Africa/Cairo", "en-US")).toBe("EGP");
    expect(pickCurrency("", "Asia/Riyadh", "en-US")).toBe("SAR");
    expect(pickCurrency("", "Europe/Paris", "en-US")).toBe("EUR");
    expect(pickCurrency("", "UTC", "ar-AE")).toBe("AED");
    expect(pickCurrency("", "America/New_York", "en-US")).toBe("USD");
  });

  it("accepts only positive finite numbers near the built-in rate", async () => {
    const { parseRates, RATE } = await import("../app/landing/Rates");
    expect(parseRates(null)).toEqual({});
    expect(parseRates({ egp: "<img>" })).toEqual({});
    expect(parseRates({ egp: { usd: 0.0185, aed: 99, sar: "0.07", kwd: Infinity, qar: 0, gbp: { a: 1 } } })).toEqual({ USD: 0.0185 });
    expect(parseRates({ egp: { usd: RATE.USD * 1.9 } })).toEqual({ USD: RATE.USD * 1.9 });
    expect(parseRates({ egp: { usd: RATE.USD * 2.1 } })).toEqual({});
    expect(parseRates({ egp: { usd: RATE.USD / 2.1 } })).toEqual({});
  });

  it("ignores a stale or malformed cache", async () => {
    const { readCache } = await import("../app/landing/Rates");
    const now = Date.now();
    expect(readCache(JSON.stringify({ at: now - 1000, r: { USD: 0.02 } }), now)).toEqual({ USD: 0.02 });
    expect(readCache(JSON.stringify({ at: now - 2 * 864e5, r: { USD: 0.02 } }), now)).toEqual({});
    expect(readCache("{nope", now)).toEqual({});
    expect(readCache(JSON.stringify({ at: now, r: { USD: "<b>" } }), now)).toEqual({});
  });
});
