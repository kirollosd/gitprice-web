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

  const dom = (name: string, domain: string, country = "EG"): PublicStore => ({ ...store(name, country), domain });
  const amazon = dom("Amazon Egypt", "amazon.eg");
  const noon = dom("Noon", "noon.com");
  const jumia = dom("Jumia Egypt", "jumia.com.eg");
  const btech = dom("B.Tech", "btech.com");
  const carrefour = dom("Carrefour", "carrefouregypt.com");
  const talabat = dom("Talabat", "talabat.com");

  it("groupByCountry puts Amazon, Noon, Jumia first within a group, rest in API order", () => {
    const groups = groupByCountry([amazon, btech, carrefour, jumia, noon, talabat]);
    expect(groups[0].stores.map((s) => s.name)).toEqual(["Amazon Egypt", "Noon", "Jumia Egypt", "B.Tech", "Carrefour", "Talabat"]);
  });

  it("groupByCountry keeps the other featured stores first when one is missing", () => {
    const groups = groupByCountry([btech, jumia, carrefour, amazon, talabat]);
    expect(groups[0].stores.map((s) => s.name)).toEqual(["Amazon Egypt", "Jumia Egypt", "B.Tech", "Carrefour", "Talabat"]);
  });

  it("groupByCountry does not feature other domains such as www.jumia.ma", () => {
    const ma = [dom("Zed", "zed.ma", "MA"), dom("Jumia Morocco", "www.jumia.ma", "MA"), dom("Amazon MA", "amazon.ma", "MA")];
    const groups = groupByCountry([...ma, btech, noon]);
    expect(groups.map((g) => g.country)).toEqual(["EG", "MA"]);
    expect(groups[0].stores.map((s) => s.name)).toEqual(["Noon", "B.Tech"]);
    expect(groups[1].stores.map((s) => s.name)).toEqual(["Zed", "Jumia Morocco", "Amazon MA"]);
  });

  it("groupByCountry does not mutate its input", () => {
    const input = [btech, noon, amazon];
    const snapshot = [...input];
    groupByCountry(input);
    expect(input).toEqual(snapshot);
    expect(input.map((s) => s.name)).toEqual(["B.Tech", "Noon", "Amazon Egypt"]);
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
