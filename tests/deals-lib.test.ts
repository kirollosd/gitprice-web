import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchDealLists, fetchDeals, listName, LIST_KEY_RE } from "../lib/deals";

const mockFetch = (r: Response) => {
  const f = vi.fn(async () => r);
  vi.stubGlobal("fetch", f);
  return f;
};
const calledUrl = (f: ReturnType<typeof mockFetch>) => new URL((f.mock.calls[0] as unknown as [string])[0]);
// the build phase turns a failed read into [] (at runtime it throws so ISR keeps the last good page)
beforeEach(() => vi.stubEnv("NEXT_PHASE", "phase-production-build"));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("fetchDeals list filter", () => {
  it("sends limit and a valid list key as search params", async () => {
    const f = mockFetch(new Response(JSON.stringify({ deals: [] })));
    await fetchDeals("phones");
    const u = calledUrl(f);
    expect(u.pathname).toBe("/api/v1/deals");
    expect(Object.fromEntries(u.searchParams)).toEqual({ limit: "30", list: "phones" });
  });

  it.each(["Phones!", "a&b=c", ""])("drops the invalid list %j", async (bad) => {
    const f = mockFetch(new Response(JSON.stringify({ deals: [] })));
    await fetchDeals(bad);
    expect(Object.fromEntries(calledUrl(f).searchParams)).toEqual({ limit: "30" });
  });

  it("returns [] on a 500 or non-JSON body", async () => {
    mockFetch(new Response("x", { status: 500 }));
    expect(await fetchDeals("phones")).toEqual([]);
    mockFetch(new Response("not json"));
    expect(await fetchDeals()).toEqual([]);
  });
});

describe("fetchDealLists", () => {
  it("keeps only valid keys with a positive count", async () => {
    const f = mockFetch(new Response(JSON.stringify({ lists: [
      { key: "phones", nameEn: "Phones", nameAr: "هواتف", count: 3 },
      { key: "BAD", nameEn: "x", nameAr: "x", count: 1 },
      { key: "food", nameEn: "Food", nameAr: "طعام", count: 0 },
    ] })));
    expect(await fetchDealLists()).toEqual([{ key: "phones", nameEn: "Phones", nameAr: "هواتف", count: 3 }]);
    expect(f).toHaveBeenCalledWith("http://localhost:8080/api/v1/deals/lists", expect.objectContaining({ credentials: "omit", next: { revalidate: 120 } }));
  });

  it("drops entries with a non-finite count or non-string names", async () => {
    mockFetch(new Response(JSON.stringify({ lists: [
      { key: "ok", nameEn: "Ok", nameAr: "تمام", count: 2 },
      { key: "nocount", nameEn: "A", nameAr: "ا" },
      { key: "strcount", nameEn: "A", nameAr: "ا", count: "5" },
      { key: "noname", nameEn: 1, nameAr: "ا", count: 1 },
      { key: "noar", nameEn: "A", count: 1 },
      null,
    ] })));
    expect((await fetchDealLists()).map((l) => l.key)).toEqual(["ok"]);
  });

  it("returns [] on a 500 or non-JSON body", async () => {
    mockFetch(new Response("x", { status: 500 }));
    expect(await fetchDealLists()).toEqual([]);
    mockFetch(new Response("not json"));
    expect(await fetchDealLists()).toEqual([]);
  });

  it("throws at runtime so ISR keeps the last good page", async () => {
    vi.stubEnv("NEXT_PHASE", "");
    mockFetch(new Response("x", { status: 500 }));
    await expect(fetchDealLists()).rejects.toThrow(/500/);
  });
});

describe("listName / LIST_KEY_RE", () => {
  it("picks the name for the locale", () => {
    const l = { nameEn: "Phones", nameAr: "هواتف" };
    expect(listName(l, "ar")).toBe("هواتف");
    expect(listName(l, "en")).toBe("Phones");
  });
  it("matches the API key shape", () => {
    expect(LIST_KEY_RE.test("phones_2")).toBe(true);
    expect(LIST_KEY_RE.test("a")).toBe(false);
    expect(LIST_KEY_RE.test("a\n")).toBe(false);
  });
});
