import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchStores, groupByCountry, type PublicStore } from "../lib/stores";

const store = (name: string, country: string): PublicStore => ({ id: name.length, name, domain: `${name}.com`, country, url: `https://${name}.com/` });
const mockFetch = (r: Response | Error) => {
  const f = vi.fn(async () => { if (r instanceof Error) throw r; return r; });
  vi.stubGlobal("fetch", f);
  return f;
};

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("stores", () => {
  it("groupByCountry puts EG first then alphabetical", () => {
    const groups = groupByCountry([store("zara", "SA"), store("noon", "EG"), store("namshi", "AE"), store("amazon", "EG")]);
    expect(groups.map((g) => g.country)).toEqual(["EG", "AE", "SA"]);
    expect(groups[0].stores.map((s) => s.name)).toEqual(["noon", "amazon"]);
  });

  it("fetchStores reads the public list without credentials", async () => {
    const list = [store("amazon", "EG")];
    const f = mockFetch(new Response(JSON.stringify({ stores: list }), { status: 200 }));
    expect(await fetchStores()).toEqual(list);
    expect(f).toHaveBeenCalledWith("http://localhost:8080/api/v1/stores/public", expect.objectContaining({ credentials: "omit" }));
  });

  it("fetchStores returns [] when fetch rejects or is non-200 during the build", async () => {
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    mockFetch(new TypeError("down"));
    expect(await fetchStores()).toEqual([]);
    mockFetch(new Response("bad gateway", { status: 502 }));
    expect(await fetchStores()).toEqual([]);
  });

  it("fetchStores throws at runtime, so ISR keeps the last good list instead of caching an empty page", async () => {
    mockFetch(new TypeError("down"));
    await expect(fetchStores()).rejects.toThrow();
    mockFetch(new Response("bad gateway", { status: 502 }));
    await expect(fetchStores()).rejects.toThrow(/502/);
  });

  it("fetchStores drops rows whose url is not https", async () => {
    mockFetch(new Response(JSON.stringify({ stores: [store("amazon", "EG"), { ...store("evil", "EG"), url: "javascript:alert(1)" }] }), { status: 200 }));
    expect((await fetchStores()).map((s) => s.name)).toEqual(["amazon"]);
  });
});
