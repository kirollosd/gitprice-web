// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import en from "../i18n/en.json";
import { AR_FONT, arInputsHash } from "../scripts/og-ar-inputs.mjs";

const root = join(__dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("share images use the Coral system", () => {
  const tsx = read("app/[locale]/opengraph-image.tsx");
  const script = read("scripts/render-og-ar.mjs");

  it("EN card uses Outfit from a woff, Coral light tokens and the landing headline", () => {
    expect(tsx).toContain('fontFamily: "Outfit"');
    expect(tsx).toContain("fontWeight: 400");
    expect(tsx).toContain("weight: 400");
    expect(tsx).not.toMatch(/weight: 500/);
    expect(tsx).toMatch(/@fontsource\/outfit\/files\/outfit-latin-400-normal\.woff"/);
    expect(tsx).toContain('tokenColor("web-ground")');
    expect(tsx).toContain('tokenColor("web-fill")');
    expect(tsx).toContain('tokenColor("web-logo")');
    expect(tsx).toContain("web.landing.hero.headline");
    expect(tsx).not.toMatch(/Fustat|web\.home\.hero|tokenColor\("(surface|accent)"\)/);
    expect(en.web.landing.hero.headline).toBeTruthy();
  });

  it("AR card is rendered with Alexandria, Coral tokens and the landing headline", () => {
    expect(script).toContain("Alexandria");
    // the landing's AR hero h1 is weight 400 (Hero.module.css .h1), so the card matches it
    expect(AR_FONT).toContain("alexandria-arabic-400-normal.woff2");
    expect(script).toContain("b64(AR_FONT)");
    expect(script).toMatch(/font-weight:400/);
    expect(script).toMatch(/h1\{.*font-weight:400/);
    expect(script).toMatch(/web-ground/);
    expect(script).toMatch(/web-fill/);
    expect(script).toContain('tok("web-logo")');
    expect(script).toContain("landing.hero.headline");
    expect(script).not.toMatch(/Noto|web\.home/);
  });

  it("og-ar.png is 1200x630", () => {
    const png = readFileSync(join(root, "app/[locale]/og-ar.png"));
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
  });

  it("the font files the cards read exist", () => {
    expect(existsSync(join(root, "node_modules/@fontsource/outfit/files/outfit-latin-400-normal.woff"))).toBe(true);
    expect(existsSync(join(root, AR_FONT))).toBe(true);
  });

  it("og-ar.png was rendered from the current inputs (re-run scripts/render-og-ar.mjs if this fails)", () => {
    expect(read("scripts/og-ar.inputs.sha").trim()).toBe(arInputsHash(root));
  });

  it("the built EN route renders a 1200x630 PNG; the AR route serves og-ar.png", async () => {
    const { default: image } = await import("../app/[locale]/opengraph-image");
    const en = Buffer.from(await (await image({ params: Promise.resolve({ locale: "en" }) })).arrayBuffer());
    expect([en.readUInt32BE(16), en.readUInt32BE(20)]).toEqual([1200, 630]);
    const ar = Buffer.from(await (await image({ params: Promise.resolve({ locale: "ar" }) })).arrayBuffer());
    expect(ar.equals(readFileSync(join(root, "app/[locale]/og-ar.png")))).toBe(true);
  });
});
