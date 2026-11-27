import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("verifyTurnstile", () => {
  it("returns false when the token is empty", async () => {
    const { verifyTurnstile } = await import("../lib/turnstile");
    expect(await verifyTurnstile({ token: "", secret: "sec" })).toBe(false);
    expect(await verifyTurnstile({ token: "   ", secret: "sec" })).toBe(false);
  });

  it("returns false when the secret is empty", async () => {
    const { verifyTurnstile } = await import("../lib/turnstile");
    expect(await verifyTurnstile({ token: "tok", secret: "" })).toBe(false);
  });

  it("POSTs siteverify and returns success", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ success: true }),
    );
    const { verifyTurnstile } = await import("../lib/turnstile");
    await expect(
      verifyTurnstile({
        token: "tok",
        secret: "sec",
        remoteip: "203.0.113.1",
        fetchImpl,
      }),
    ).resolves.toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(init.method).toBe("POST");
    const body = init.body as URLSearchParams;
    expect(body.get("secret")).toBe("sec");
    expect(body.get("response")).toBe("tok");
    expect(body.get("remoteip")).toBe("203.0.113.1");
  });

  it("returns false on Cloudflare success:false or network errors", async () => {
    const { verifyTurnstile } = await import("../lib/turnstile");
    const fail = vi.fn(async () => Response.json({ success: false }));
    expect(await verifyTurnstile({ token: "tok", secret: "sec", fetchImpl: fail })).toBe(false);
    const boom = vi.fn(async () => {
      throw new Error("network");
    });
    expect(await verifyTurnstile({ token: "tok", secret: "sec", fetchImpl: boom })).toBe(false);
  });
});
