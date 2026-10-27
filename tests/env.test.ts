import { describe, expect, test } from "vitest";
import { readEnv } from "../lib/env";

const base = {
  NEXT_PUBLIC_API_BASE_URL: "https://api.example.com",
  NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  NEXT_PUBLIC_SITE_URL: "https://gitprice.com",
};

describe("readEnv", () => {
  test("readEnv throws when LAUNCH=1 and CHROME_STORE_URL missing", () =>
    expect(() => readEnv({ ...base, NEXT_PUBLIC_LAUNCH: "1" })).toThrow(/NEXT_PUBLIC_CHROME_STORE_URL/));

  test("readEnv allows missing store URLs in prelaunch", () => {
    const e = readEnv(base);
    expect(e.launch).toBe(false);
    expect(e.siteUrl).toBe("https://gitprice.com");
  });

  test("checkout is off unless NEXT_PUBLIC_CHECKOUT=1", () => {
    expect(readEnv(base).checkout).toBe(false);
    expect(readEnv({ ...base, NEXT_PUBLIC_CHECKOUT: "0" }).checkout).toBe(false);
    expect(readEnv({ ...base, NEXT_PUBLIC_CHECKOUT: "1" }).checkout).toBe(true);
  });

  test("readEnv accepts launch with only the Chrome store URL (phase 1 is extension only)", () => {
    const e = readEnv({ ...base, NEXT_PUBLIC_LAUNCH: "1", NEXT_PUBLIC_CHROME_STORE_URL: "https://c" });
    expect(e.launch).toBe(true);
    expect(e.chromeStoreUrl).toBe("https://c");
    expect(e.appStoreUrl).toBeUndefined();
  });

  test("readEnv throws one error naming every missing required var", () => {
    expect.assertions(2);
    try {
      readEnv({});
    } catch (e) {
      const m = (e as Error).message;
      expect(m).toMatch(/NEXT_PUBLIC_API_BASE_URL.*NEXT_PUBLIC_SUPABASE_URL.*NEXT_PUBLIC_SUPABASE_ANON_KEY.*NEXT_PUBLIC_SITE_URL/s);
      expect(m).not.toMatch(/STORE_URL|TALLY/);
    }
  });
});

describe("sellersNav flag", () => {
  test("is off unless NEXT_PUBLIC_SELLERS_NAV=1", () => {
    expect(readEnv(base).sellersNav).toBe(false);
    expect(readEnv({ ...base, NEXT_PUBLIC_SELLERS_NAV: "0" }).sellersNav).toBe(false);
    expect(readEnv({ ...base, NEXT_PUBLIC_SELLERS_NAV: "true" }).sellersNav).toBe(false);
    expect(readEnv({ ...base, NEXT_PUBLIC_SELLERS_NAV: "1" }).sellersNav).toBe(true);
  });
});

describe("gtmId", () => {
  test("is undefined when unset and the id when set", () => {
    expect(readEnv(base).gtmId).toBeUndefined();
    expect(readEnv({ ...base, NEXT_PUBLIC_GTM_ID: "GTM-PLZZJV54" }).gtmId).toBe("GTM-PLZZJV54");
  });
});
