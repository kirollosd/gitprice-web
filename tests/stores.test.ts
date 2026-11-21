import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchStores, groupByCountry, type PublicStore } from "../lib/stores";

const store = (name: string, country: string): PublicStore => ({ id: name.length, name, domain: `${name}.com`, country, url: `https://${name}.com/` });
const mockFetch = (r: Response | Error) => {
  const f = vi.fn(async () => { if (r instanceof Error) throw r; return r; });
  vi.stubGlobal("fetch", f);
  return f;
};

afterEach(() => vi.unstubAllGlobals());

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

  it("fetchStores returns [] when fetch rejects", async () => {
    mockFetch(new TypeError("down"));
    expect(await fetchStores()).toEqual([]);
  });

  it("fetchStores returns [] on non-200", async () => {
    mockFetch(new Response("bad gateway", { status: 502 }));
    expect(await fetchStores()).toEqual([]);
  });

  it("fetchStores drops rows whose url is not https", async () => {
    mockFetch(new Response(JSON.stringify({ stores: [store("amazon", "EG"), { ...store("evil", "EG"), url: "javascript:alert(1)" }] }), { status: 200 }));
    expect((await fetchStores()).map((s) => s.name)).toEqual(["amazon"]);
  });
});
