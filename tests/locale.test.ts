import { describe, expect, it } from "vitest";
import { hasMinimalNav, isHostedPath, localeFromPath, pathFor, suggestLocale, switchPath } from "../lib/locale";

describe("localeFromPath", () => {
  it("parses locale and rest", () => {
    expect(localeFromPath("/ar/sellers")).toEqual({ locale: "ar", rest: "/sellers" });
    expect(localeFromPath("/ar")).toEqual({ locale: "ar", rest: "/" });
    expect(localeFromPath("/")).toEqual({ locale: "en", rest: "/" });
    expect(localeFromPath("/sellers")).toEqual({ locale: "en", rest: "/sellers" });
    expect(localeFromPath("/ar/")).toEqual({ locale: "ar", rest: "/" });
    expect(localeFromPath("/sellers/")).toEqual({ locale: "en", rest: "/sellers/" });
    expect(localeFromPath("/arabic")).toEqual({ locale: "en", rest: "/arabic" });
  });
  it("strips the /en prefix the middleware rewrite adds", () => {
    expect(localeFromPath("/en")).toEqual({ locale: "en", rest: "/" });
    expect(localeFromPath("/en/")).toEqual({ locale: "en", rest: "/" });
    expect(localeFromPath("/en/privacy")).toEqual({ locale: "en", rest: "/privacy" });
    expect(localeFromPath("/en/sellers")).toEqual({ locale: "en", rest: "/sellers" });
    expect(localeFromPath("/english")).toEqual({ locale: "en", rest: "/english" });
  });
});

describe("switchPath", () => {
  it("never builds /ar/en/... from a rewritten English path", () => {
    expect(switchPath("/en/privacy", "", "ar")).toBe("/ar/privacy");
    expect(switchPath("/en", "", "ar")).toBe("/ar");
    expect(switchPath("/en/welcome", "#x", "ar")).toBe("/ar/welcome#x");
    expect(switchPath("/ar/privacy", "", "en")).toBe("/privacy");
  });
  it("drops the hash on hosted pages, with or without the /en prefix", () => {
    expect(switchPath("/en/reset-password", "#access_token=x", "ar")).toBe("/ar/reset-password");
    expect(switchPath("/ar/checkout/return", "#t", "en")).toBe("/checkout/return");
  });
  it("hosted and minimal-nav checks see the locale-less rest", () => {
    expect(isHostedPath(localeFromPath("/en/checkout").rest)).toBe(true);
    expect(hasMinimalNav(localeFromPath("/en/welcome").rest)).toBe(true);
    expect(hasMinimalNav(localeFromPath("/en/sellers").rest)).toBe(false);
  });
});

describe("pathFor", () => {
  it("builds locale paths", () => {
    expect(pathFor("ar", "/")).toBe("/ar");
    expect(pathFor("ar", "/sellers")).toBe("/ar/sellers");
    expect(pathFor("en", "/sellers")).toBe("/sellers");
    expect(pathFor("en", "/")).toBe("/");
  });
});

describe("suggestLocale", () => {
  it("suggests ar when preferred over en", () => {
    expect(suggestLocale("ar-EG,ar;q=0.9,en;q=0.8", "en")).toBe("ar");
    expect(suggestLocale("ar", "en")).toBe("ar");
  });
  it("returns null otherwise", () => {
    expect(suggestLocale("en-US", "en")).toBeNull();
    expect(suggestLocale("ar", "ar")).toBeNull();
    expect(suggestLocale("en;q=0.9,ar;q=0.8", "en")).toBeNull();
    expect(suggestLocale("ar,en", "en")).toBeNull(); // equal q: not strictly higher
    expect(suggestLocale("*", "en")).toBeNull();
    expect(suggestLocale(null, "en")).toBeNull();
    expect(suggestLocale(";;q=,,ar;q=x", "en")).toBeNull();
  });
});
