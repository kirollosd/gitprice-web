import { describe, expect, it } from "vitest";
import { localeFromPath, pathFor, suggestLocale } from "../lib/locale";

describe("localeFromPath", () => {
  it("parses locale and rest", () => {
    expect(localeFromPath("/ar/sellers")).toEqual({ locale: "ar", rest: "/sellers" });
    expect(localeFromPath("/ar")).toEqual({ locale: "ar", rest: "/" });
    expect(localeFromPath("/")).toEqual({ locale: "en", rest: "/" });
    expect(localeFromPath("/sellers")).toEqual({ locale: "en", rest: "/sellers" });
    expect(localeFromPath("/arabic")).toEqual({ locale: "en", rest: "/arabic" });
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
