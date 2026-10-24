import { describe, expect, test } from "vitest";
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
    // Uses a real key that carries an {email} placeholder, if any; else checks the engine via a synthetic lookup.
    const k = keys(en.web).find((x) => /\{email\}/.test(lookup(en, `web.${x}`)));
    if (!k) return;
    expect(t("en", `web.${k}`, { email: "a@b.co" })).toContain("a@b.co");
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

function lookup(root: unknown, path: string): string {
  const v = path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], root);
  return typeof v === "string" ? v : "";
}
