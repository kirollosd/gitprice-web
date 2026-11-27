import { describe, expect, it } from "vitest";
import { chromeStoreUrlWithUtms, parseUtms, withUtms } from "../lib/utm";

describe("parseUtms", () => {
  it("reads convention fields from a URLSearchParams-like map", () => {
    const params = new URLSearchParams(
      "utm_source=ig&utm_medium=paid&utm_campaign=bf26&utm_content=story_a",
    );
    expect(parseUtms(params)).toEqual({
      utm_source: "ig",
      utm_medium: "paid",
      utm_campaign: "bf26",
      utm_content: "story_a",
    });
  });

  it("preserves unknown utm_* keys and drops empty values", () => {
    const params = new URLSearchParams("utm_source=fb&utm_term=shoes&utm_id=&foo=1");
    expect(parseUtms(params)).toEqual({
      utm_source: "fb",
      utm_term: "shoes",
    });
  });

  it("returns an empty object when nothing is present", () => {
    expect(parseUtms(new URLSearchParams("q=1"))).toEqual({});
  });
});

describe("withUtms", () => {
  it("appends UTMs onto a bare URL", () => {
    const out = withUtms("https://chromewebstore.google.com/detail/x", {
      utm_source: "tt",
      utm_medium: "organic",
      utm_campaign: "always_on",
    });
    expect(out).toBe(
      "https://chromewebstore.google.com/detail/x?utm_source=tt&utm_medium=organic&utm_campaign=always_on",
    );
  });

  it("preserves existing query params and overwrites matching UTMs", () => {
    const out = withUtms("https://example.com/path?hl=en&utm_source=old", {
      utm_source: "fb",
      utm_medium: "paid",
    });
    const url = new URL(out);
    expect(url.searchParams.get("hl")).toBe("en");
    expect(url.searchParams.get("utm_source")).toBe("fb");
    expect(url.searchParams.get("utm_medium")).toBe("paid");
  });

  it("passes through unknown UTMs", () => {
    const out = withUtms("https://example.com/", {
      utm_source: "ig",
      utm_term: "bags",
      utm_custom: "x",
    });
    const url = new URL(out);
    expect(url.searchParams.get("utm_term")).toBe("bags");
    expect(url.searchParams.get("utm_custom")).toBe("x");
  });

  it("returns the base URL unchanged when UTMs are empty", () => {
    expect(withUtms("https://example.com/a", {})).toBe("https://example.com/a");
  });
});

describe("chromeStoreUrlWithUtms", () => {
  it("builds a CWS URL from the store base and parsed UTMs", () => {
    const base = "https://chromewebstore.google.com/detail/gitprice/abc";
    const utms = parseUtms(
      new URLSearchParams("utm_source=fb&utm_medium=paid&utm_campaign=ramadan27&utm_content=c1"),
    );
    expect(chromeStoreUrlWithUtms(base, utms)).toBe(
      `${base}?utm_source=fb&utm_medium=paid&utm_campaign=ramadan27&utm_content=c1`,
    );
  });

  it("returns the bare store URL when UTMs are missing", () => {
    expect(chromeStoreUrlWithUtms("https://cws.test/x", {})).toBe("https://cws.test/x");
  });
});
