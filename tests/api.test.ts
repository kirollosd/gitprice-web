import { afterEach, describe, expect, it, vi } from "vitest";
import { getHandoffSummary, getReturnStatus, redeemHandoff } from "../lib/api";

const BASE = "http://localhost:8080/api/v1";
const reply = (status: number, body: unknown) => new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
const mockFetch = (r: Response | Error) => {
  const f = vi.fn(async () => { if (r instanceof Error) throw r; return r; });
  vi.stubGlobal("fetch", f);
  return f;
};
const ok = (data: unknown) => ({ success: true, data, error: null, meta: {} });
const fail = (code: string) => ({ success: false, data: null, error: { code, message: "m" }, meta: {} });

afterEach(() => vi.unstubAllGlobals());

describe("api", () => {
  it("parses the envelope and sends no credentials or referrer", async () => {
    const data = { plan: "pro_monthly", priceMinor: 9900, currency: "EGP", period: "month" };
    const f = mockFetch(reply(200, ok(data)));
    expect(await getHandoffSummary("abc")).toEqual({ ok: true, data });
    expect(f).toHaveBeenCalledWith(`${BASE}/subscription/checkout/handoff/abc/summary`, expect.objectContaining({ credentials: "omit", referrerPolicy: "no-referrer" }));
  });

  it.each([
    [404, "HANDOFF_NOT_FOUND"], [410, "HANDOFF_EXPIRED"], [409, "ALREADY_PRO"], [503, "PRICE_NOT_CONFIGURED"],
  ])("maps %i %s to status and code", async (status, code) => {
    mockFetch(reply(status, fail(code)));
    expect(await getHandoffSummary("x")).toEqual({ ok: false, status, code });
  });

  it("returns NETWORK on a throw and on a non-JSON response", async () => {
    mockFetch(new TypeError("down"));
    expect(await getReturnStatus("t")).toEqual({ ok: false, status: 0, code: "NETWORK" });
    mockFetch(reply(502, "<html>bad gateway</html>"));
    expect(await getReturnStatus("t")).toEqual({ ok: false, status: 0, code: "NETWORK" });
  });

  it("url-encodes the code and token", async () => {
    const f = mockFetch(reply(200, ok({ status: "pending" })));
    await getReturnStatus("a/b?c#d");
    expect((f.mock.calls[0] as unknown[])[0]).toBe(`${BASE}/subscription/checkout/return/a%2Fb%3Fc%23d`);
  });

  it("redeem POSTs the locale as JSON", async () => {
    const f = mockFetch(reply(200, ok({ redirectUrl: "https://pay.test/x" })));
    expect(await redeemHandoff("c", "ar")).toEqual({ ok: true, data: { redirectUrl: "https://pay.test/x" } });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${BASE}/subscription/checkout/handoff/c/redeem`);
    expect(init).toMatchObject({ method: "POST", body: '{"locale":"ar"}', credentials: "omit", referrerPolicy: "no-referrer" });
  });

  it("an error envelope without a code is UNKNOWN", async () => {
    mockFetch(reply(500, { success: false, data: null, error: null }));
    expect(await redeemHandoff("c", "en")).toEqual({ ok: false, status: 500, code: "UNKNOWN" });
  });
});
