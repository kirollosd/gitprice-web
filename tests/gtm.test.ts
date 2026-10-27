import { afterEach, describe, expect, it } from "vitest";
import { consentDefaultScript, gtag, gtmScript } from "../lib/gtm";

function run(cookie: string) {
  const win: { dataLayer?: unknown[] } = {};
  new Function("window", "document", consentDefaultScript())(win, { cookie });
  return (win.dataLayer ?? []).map((a) => Array.from(a as ArrayLike<unknown>));
}

describe("consentDefaultScript", () => {
  it("denies everything with no cookie and pushes no update", () => {
    expect(run("")).toEqual([
      ["consent", "default", {
        ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied", wait_for_update: 500,
      }],
    ]);
  });
  it("grants only analytics when gp_consent=allow", () => {
    const dl = run("a=1; gp_consent=allow");
    expect(dl).toHaveLength(2);
    expect(dl[1]).toEqual(["consent", "update", { analytics_storage: "granted" }]);
  });
  it("ignores look-alike cookies", () => {
    expect(run("x_gp_consent=allow; gp_consent=decline")).toHaveLength(1);
  });
});

describe("gtmScript", () => {
  it("loads gtm.js with the JSON-encoded id", () => {
    const s = gtmScript("GTM-PLZZJV54");
    expect(s).toContain("googletagmanager.com/gtm.js?id=");
    expect(s).toContain('"GTM-PLZZJV54"');
  });
});

describe("gtag", () => {
  afterEach(() => { delete (window as { dataLayer?: unknown }).dataLayer; });
  it("creates dataLayer and pushes the arguments object", () => {
    gtag("event", "x", { a: 1 });
    const w = window as unknown as { dataLayer: ArrayLike<unknown>[] };
    expect(Array.from(w.dataLayer[0])).toEqual(["event", "x", { a: 1 }]);
  });
  it("never throws", () => {
    (window as { dataLayer?: unknown }).dataLayer = 5;
    expect(() => gtag("event")).not.toThrow();
  });
});
