import { describe, expect, test, vi } from "vitest";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";
import { dir, t } from "../lib/i18n";

const keys = (o: unknown, p = ""): string[] =>
  o && typeof o === "object"
    ? Object.entries(o).flatMap(([k, v]) => keys(v, p ? `${p}.${k}` : k))
    : [p];

describe("i18n", () => {
  test("every en web.* key exists in ar and vice versa", () => {
    expect(keys(ar.web).sort()).toEqual(keys(en.web).sort());
  });

  test("t interpolates {email}", () => {
    const out = t("en", "web.resetPassword.body", { email: "a@b.co" });
    expect(out).toContain("a@b.co");
    expect(out).not.toContain("{email}");
  });

  test("web.landing is synced, with the theme toggle labels in both locales", () => {
    expect(t("en", "web.landing.theme.toDark")).toBe("Switch to dark");
    expect(t("en", "web.landing.theme.toLight")).toBe("Switch to light");
    expect(t("ar", "web.landing.theme.toDark")).toBe(ar.web.landing.theme.toDark);
  });

  test("t interpolates numbers into landing placeholders", () => {
    expect(t("en", "web.landing.foot.copyright", { year: 2026 })).toContain("2026");
    expect(t("en", "web.landing.alerts.anyDrops", { count: 3, week: "W1", price: "EGP 10" })).not.toMatch(/\{\w+\}/);
  });

  test("t returns the key instead of throwing in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      expect(t("en", "web.nope.nothing")).toBe("web.nope.nothing");
      expect(warn).toHaveBeenCalled();
    } finally {
      warn.mockRestore();
      vi.unstubAllEnvs();
    }
  });

  test("t throws on a missing key", () => {
    expect(() => t("en", "web.nope.nothing")).toThrow(/web\.nope\.nothing/);
  });

  test("t returns Arabic strings for ar", () => {
    expect(t("ar", "web.home.hero.headline")).toBe(ar.web.home.hero.headline);
  });

  test("dir maps ar to rtl", () => {
    expect(dir("ar")).toBe("rtl");
    expect(dir("en")).toBe("ltr");
  });
});
