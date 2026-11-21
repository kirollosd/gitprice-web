import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchDeals, formatDealTime, formatEGP, type PublicDeal } from "../lib/deals";

const deal = (over: Partial<PublicDeal> = {}): PublicDeal => ({
  title: "Phone X", storeName: "Amazon Egypt", price: 68, currency: "EGP", observedAt: "2026-11-21T12:05:00Z",
  insights: [{ kind: "cheaper_than", otherStore: "Noon", diff: 22 }], buyUrl: "https://amazon.eg/dp/B0AAAAAAAA?tag=gitpriceeg-21",
  productUrl: "https://amazon.eg/dp/B0AAAAAAAA", status: "posted", ...over,
});
const mockFetch = (r: Response | Error) => {
  const f = vi.fn(async () => { if (r instanceof Error) throw r; return r; });
  vi.stubGlobal("fetch", f);
  return f;
};

afterEach(() => vi.unstubAllGlobals());

describe("deals", () => {
  it("fetchDeals reads the public feed without credentials, revalidated every 2 minutes", async () => {
    const f = mockFetch(new Response(JSON.stringify({ deals: [deal()] }), { status: 200 }));
    expect(await fetchDeals()).toEqual([deal()]);
    expect(f).toHaveBeenCalledWith("http://localhost:8080/api/v1/deals?limit=30", expect.objectContaining({ credentials: "omit", next: { revalidate: 120 } }));
  });

  it("fetchDeals returns [] on error", async () => {
    mockFetch(new TypeError("down"));
    expect(await fetchDeals()).toEqual([]);
    mockFetch(new Response("bad gateway", { status: 502 }));
    expect(await fetchDeals()).toEqual([]);
  });

  it("fetchDeals drops deals whose buy link is not https", async () => {
    mockFetch(new Response(JSON.stringify({ deals: [deal(), deal({ title: "evil", buyUrl: "javascript:alert(1)" })] }), { status: 200 }));
    expect((await fetchDeals()).map((d) => d.title)).toEqual(["Phone X"]);
  });

  it("formatDealTime renders Cairo time as HH:MM with Latin digits", () => {
    expect(formatDealTime("2026-11-21T12:05:00Z")).toBe("14:05");
    expect(formatDealTime("2026-07-01T23:30:00Z")).toBe("02:30"); // summer: UTC+3
  });

  it("formatEGP matches the channel: comma thousands, decimals only when not whole", () => {
    expect(formatEGP(1299)).toBe("1,299");
    expect(formatEGP(68.5)).toBe("68.50");
  });
});
