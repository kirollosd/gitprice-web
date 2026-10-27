import { describe, expect, it, vi } from "vitest";
import { readToneConfig, THEME_BOOT, TONE_KEYS, toneCss } from "../lib/theme";

// lib/theme must not read files at runtime (global-not-found renders per request, and the config is not traced):
// any fs read from it fails this suite. Tests read through vi.importActual.
vi.mock("node:fs", () => ({ readFileSync: () => { throw new Error("lib/theme touched fs"); } }));

// The file source is the parsed JSON object (bundled import in production).
const file = (content: unknown) => (typeof content === "string" ? JSON.parse(content) : content);

describe("readToneConfig", () => {
  it("merges the file, then GP_THEME on top", () => {
    const f = file({ light: { ink: "#111" }, dark: { acc: "#FF5A4E" } });
    const c = readToneConfig({ GP_THEME: '{"dark":{"acc":"#00AA88"}}' }, f);
    expect(c).toEqual({ light: { ink: "#111" }, dark: { acc: "#00AA88" } });
  });
  it("reads the file alone and ignores $comment", () => {
    expect(readToneConfig({}, file({ $comment: "x", light: {}, dark: { save: "rgba(1, 2, 3, .5)" } }))).toEqual({ light: {}, dark: { save: "rgba(1, 2, 3, .5)" } });
  });
  it("the shipped theme.config.json is bundled, empty and valid (no fs)", () => {
    expect(toneCss(readToneConfig({}))).toBe("");
    expect(toneCss(readToneConfig({ GP_THEME: '{"dark":{"acc":"#00AA88"}}' }))).toContain("#00AA88");
  });
  it("rejects an unknown key", () => {
    expect(() => readToneConfig({ GP_THEME: '{"dark":{"nope":"#fff"}}' }, file({}))).toThrow(/theme: unknown key nope in dark/);
    expect(() => readToneConfig({}, file('{"light":{"__proto__":"#fff"}}'))).toThrow(/unknown key/);
  });
  it("rejects an unknown mode and a non-object mode", () => {
    expect(() => readToneConfig({ GP_THEME: '{"dim":{}}' }, file({}))).toThrow(/theme:/);
    expect(() => readToneConfig({ GP_THEME: '{"dark":"#fff"}' }, file({}))).toThrow(/theme:/);
    expect(() => readToneConfig({ GP_THEME: "[]" }, file({}))).toThrow(/theme:/);
  });
  it("rejects non-color values", () => {
    expect(() => readToneConfig({ GP_THEME: '{"dark":{"acc":"red;}body{display:none"}}' }, file({}))).toThrow(/theme: dark.acc is not a color/);
    for (const v of ["red", "#12", "#12345", "#1234567", "#123456789", "rgb(1,2,3);}", "url(x)", "var(--x)", "#fff</style>", 3])
      expect(() => readToneConfig({}, file({ light: { acc: v } })), String(v)).toThrow(/not a color/);
  });
  it("rejects malformed GP_THEME JSON with a theme: error", () => {
    expect(() => readToneConfig({ GP_THEME: "{" }, file({}))).toThrow(/theme: GP_THEME/);
  });
});

describe("toneCss", () => {
  it("is empty for an empty config", () => {
    expect(toneCss({})).toBe("");
    expect(toneCss({ light: {}, dark: {} })).toBe("");
  });
  it("writes the light block", () => {
    const css = toneCss({ light: { acc: "#C8261A" } });
    expect(css).toContain('[data-gp="web"]{--gp-web-acc:#C8261A}');
    expect(css).not.toContain("data-theme");
  });
  it("writes both dark selectors", () => {
    const css = toneCss({ dark: { acc: "#00AA88", "on-dark": "#fff" } });
    expect(css).toContain('[data-gp="web"][data-theme="dark"]{--gp-web-acc:#00AA88;--gp-web-on-dark:#fff}');
    expect(css).toContain('@media (prefers-color-scheme: dark){html[data-gp="web"]:not([data-theme="light"]){--gp-web-acc:#00AA88;--gp-web-on-dark:#fff}}');
  });
});

describe("TONE_KEYS and THEME_BOOT", () => {
  it("lists the 28 web token names", () => {
    expect(TONE_KEYS).toHaveLength(28);
    expect(TONE_KEYS).toContain("dock-save");
  });
  it("every tone key is a --gp-web-* token in the synced tokens", async () => {
    const fs = await vi.importActual<typeof import("node:fs")>("node:fs");
    const css = fs.readFileSync("styles/tokens.css", "utf8");
    for (const k of TONE_KEYS) expect(css, k).toContain(`--gp-web-${k}:`);
  });
  it("applies a stored theme and ignores junk or a throwing localStorage", () => {
    const run = () => new Function(THEME_BOOT)();
    const root = document.documentElement;
    localStorage.setItem("gp-theme", "dark");
    run();
    expect(root.dataset.theme).toBe("dark");
    delete root.dataset.theme;
    localStorage.setItem("gp-theme", "blue");
    run();
    expect(root.dataset.theme).toBeUndefined();
    const get = Storage.prototype.getItem;
    Storage.prototype.getItem = () => { throw new Error("blocked"); };
    try { expect(run).not.toThrow(); } finally { Storage.prototype.getItem = get; localStorage.clear(); }
  });
});
