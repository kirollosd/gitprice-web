import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.hoisted(() => vi.fn());
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

const envStore = vi.hoisted(() => ({
  RESEND_API_KEY: "re_test" as string | undefined,
  RESEND_FROM: "GitPrice <hello@gitprice.com>" as string | undefined,
  META_CAPI_ACCESS_TOKEN: undefined as string | undefined,
  NEXT_PUBLIC_META_PIXEL_ID: undefined as string | undefined,
}));

vi.mock("../lib/env", () => ({
  env: { chromeStoreUrl: "https://chromewebstore.test/gitprice", siteUrl: "http://localhost:3000" },
}));

function stubProcessEnv() {
  vi.stubEnv("RESEND_API_KEY", envStore.RESEND_API_KEY ?? "");
  vi.stubEnv("RESEND_FROM", envStore.RESEND_FROM ?? "");
  vi.stubEnv("META_CAPI_ACCESS_TOKEN", envStore.META_CAPI_ACCESS_TOKEN ?? "");
  vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", envStore.NEXT_PUBLIC_META_PIXEL_ID ?? "");
}

async function post(body: unknown, headers: Record<string, string> = {}) {
  const { POST } = await import("../app/api/send-to-desktop/route");
  const req = new Request("http://localhost:3000/api/send-to-desktop", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.10", ...headers },
    body: JSON.stringify(body),
  });
  return POST(req);
}

beforeEach(() => {
  sendMock.mockReset();
  sendMock.mockResolvedValue({ data: { id: "email_1" }, error: null });
  envStore.RESEND_API_KEY = "re_test";
  envStore.RESEND_FROM = "GitPrice <hello@gitprice.com>";
  envStore.META_CAPI_ACCESS_TOKEN = undefined;
  envStore.NEXT_PUBLIC_META_PIXEL_ID = undefined;
  stubProcessEnv();
  vi.resetModules();
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/send-to-desktop", () => {
  it("returns 400 for an invalid email", async () => {
    const res = await post({ email: "not-an-email", website: "" });
    expect(res.status).toBe(400);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("returns 204 and sends nothing when the honeypot is filled", async () => {
    const res = await post({ email: "sara@example.com", website: "http://spam.test" });
    expect(res.status).toBe(204);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("returns 503 when Resend env is missing", async () => {
    envStore.RESEND_API_KEY = undefined;
    stubProcessEnv();
    vi.resetModules();
    const res = await post({ email: "sara@example.com", website: "" });
    expect(res.status).toBe(503);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("returns 200 and emails the CWS link with UTMs on success", async () => {
    const res = await post({
      email: "sara@example.com",
      website: "",
      locale: "ar",
      utms: { utm_source: "ig", utm_medium: "paid", utm_campaign: "bf26" },
    });
    expect(res.status).toBe(200);
    expect(sendMock).toHaveBeenCalledTimes(1);
    const arg = sendMock.mock.calls[0]![0] as { to: string; from: string; subject: string; html: string };
    expect(arg.to).toBe("sara@example.com");
    expect(arg.from).toBe("GitPrice <hello@gitprice.com>");
    expect(arg.html).toContain("utm_source=ig");
    expect(arg.html).toContain("utm_medium=paid");
    expect(arg.html).toContain("utm_campaign=bf26");
    expect(arg.html).toContain("https://chromewebstore.test/gitprice");
  });

  it("returns 429 after the rate limit is exceeded for one IP", async () => {
    for (let i = 0; i < 5; i++) {
      const res = await post({ email: `ok${i}@example.com`, website: "" }, { "x-forwarded-for": "198.51.100.7" });
      expect(res.status).toBe(200);
    }
    const blocked = await post({ email: "more@example.com", website: "" }, { "x-forwarded-for": "198.51.100.7" });
    expect(blocked.status).toBe(429);
  });

  it("calls Meta CAPI only when consent is allow", async () => {
    const capi = vi.fn(async () => {});
    vi.doMock("../lib/meta-capi", () => ({ sendMetaCapiEvent: capi }));
    vi.resetModules();
    const { POST } = await import("../app/api/send-to-desktop/route");
    const make = (consent: string) =>
      new Request("http://localhost:3000/api/send-to-desktop", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.50" },
        body: JSON.stringify({ email: "sara@example.com", website: "", consent, locale: "en" }),
      });
    expect((await POST(make("decline"))).status).toBe(200);
    expect(capi).not.toHaveBeenCalled();
    expect((await POST(make("allow"))).status).toBe(200);
    expect(capi).toHaveBeenCalledTimes(1);
    expect(capi.mock.calls[0]![0]).toMatchObject({ event: "send_to_desktop" });
  });
});
