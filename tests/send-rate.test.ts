import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("send-rate (memory fallback)", () => {
  it("allows up to max hits then blocks within the window", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { hitIpLimit, __resetSendRateForTests } = await import("../lib/send-rate");
    __resetSendRateForTests();
    for (let i = 0; i < 5; i++) {
      expect(await hitIpLimit("10.0.0.1", 5, 60_000)).toBe(false);
    }
    expect(await hitIpLimit("10.0.0.1", 5, 60_000)).toBe(true);
    expect(await hitIpLimit("10.0.0.2", 5, 60_000)).toBe(false);
  });

  it("only cools down an email after markEmailSent", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const mod = await import("../lib/send-rate");
    mod.__resetSendRateForTests();
    expect(await mod.isEmailCoolingDown("a@example.com")).toBe(false);
    await mod.markEmailSent("a@example.com", 15 * 60_000);
    expect(await mod.isEmailCoolingDown("a@example.com")).toBe(true);
    expect(await mod.isEmailCoolingDown("b@example.com")).toBe(false);
  });
});
