import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendMetaCapiEvent } from "../lib/meta-capi";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "pix_1");
  vi.stubEnv("META_CAPI_ACCESS_TOKEN", "token_1");
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sendMetaCapiEvent", () => {
  it("no-ops when env is missing", async () => {
    vi.stubEnv("META_CAPI_ACCESS_TOKEN", "");
    const fetchImpl = vi.fn();
    await sendMetaCapiEvent({ event: "send_to_desktop", email: "a@b.com", fetchImpl });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("POSTs a hashed email and never includes the raw address", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }));
    await sendMetaCapiEvent({
      event: "send_to_desktop",
      email: "Sara@Example.com",
      eventSourceUrl: "https://gitprice.com/ar/get",
      clientIp: "203.0.113.9",
      userAgent: "TestUA",
      fetchImpl,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("pix_1");
    expect(url).toContain("access_token=token_1");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    const body = JSON.parse(String(init.body)) as {
      data: Array<{ event_name: string; user_data: { em: string; client_ip_address: string } }>;
    };
    expect(body.data[0]!.event_name).toBe("send_to_desktop");
    expect(body.data[0]!.user_data.em).toBe(
      createHash("sha256").update("sara@example.com").digest("hex"),
    );
    expect(JSON.stringify(body).toLowerCase()).not.toContain("sara@example.com");
    expect(body.data[0]!.user_data.client_ip_address).toBe("203.0.113.9");
  });

  it("swallows fetch errors", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("down");
    });
    await expect(
      sendMetaCapiEvent({ event: "cws_click", fetchImpl }),
    ).resolves.toBeUndefined();
  });
});
