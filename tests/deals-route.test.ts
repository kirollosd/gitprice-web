import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/deals", async (orig) => ({ ...(await orig<typeof import("../lib/deals")>()), fetchDealLists: vi.fn(), fetchDeals: vi.fn() }));
import { fetchDealLists, fetchDeals, settle } from "../lib/deals";
import { generateMetadata } from "../app/[locale]/deals/page";

const props = (list?: string) => ({ params: Promise.resolve({ locale: "en" as const }), searchParams: Promise.resolve({ list }) });
const LISTS = [{ key: "phones", nameEn: "Phones", nameAr: "هواتف", count: 1 }];

afterEach(() => vi.restoreAllMocks());

describe("settle", () => {
  it("returns the data untouched on success", async () => {
    expect(await settle(Promise.resolve([1]))).toEqual({ data: [1], failed: false });
  });

  it("returns empty + failed on error and logs only a fixed message with the error name and HTTP status", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = Object.assign(new Error("deals feed: HTTP 503 https://api.example/api/v1/deals?list=secret body={x}"), { name: "Error" });
    expect(await settle(Promise.reject(err))).toEqual({ data: [], failed: true });
    expect(log).toHaveBeenCalledTimes(1);
    const line = log.mock.calls[0].join(" ");
    expect(line).toContain("503");
    expect(line).not.toMatch(/secret|https?:|body/);
  });

  it("can fail quietly for a second read of the same request", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await settle(Promise.reject(new Error("x")), false);
    expect(log).not.toHaveBeenCalled();
  });
});

describe("/deals generateMetadata", () => {
  it("is indexable when the API answers, and names the selected list in the title", async () => {
    vi.mocked(fetchDealLists).mockResolvedValue(LISTS);
    vi.mocked(fetchDeals).mockResolvedValue([]);
    const m = await generateMetadata(props("phones"));
    expect(m.robots).toBeUndefined();
    expect(JSON.stringify(m.title)).toContain("Phones");
  });

  it("is noindex when the lists read fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(fetchDealLists).mockRejectedValue(new Error("deal lists: HTTP 500"));
    vi.mocked(fetchDeals).mockResolvedValue([]);
    expect((await generateMetadata(props())).robots).toEqual({ index: false, follow: false });
  });

  it("is noindex when the deals read fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(fetchDealLists).mockResolvedValue(LISTS);
    vi.mocked(fetchDeals).mockRejectedValue(new Error("deals feed: HTTP 500"));
    expect((await generateMetadata(props())).robots).toEqual({ index: false, follow: false });
  });
});
