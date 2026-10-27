import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import en from "../i18n/en.json";

const root = join(__dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("share images use the Coral system", () => {
  const tsx = read("app/[locale]/opengraph-image.tsx");
  const script = read("scripts/render-og-ar.mjs");

  it("EN card uses Outfit from a woff, Coral light tokens and the landing headline", () => {
    expect(tsx).toContain('fontFamily: "Outfit"');
    expect(tsx).toMatch(/@fontsource\/outfit\/files\/outfit-latin-\d+-normal\.woff"/);
    expect(tsx).toContain('tokenColor("web-ground")');
    expect(tsx).toContain('tokenColor("web-fill")');
    expect(tsx).toContain('tokenColor("web-logo")');
    expect(tsx).toContain("web.landing.hero.headline");
    expect(tsx).not.toMatch(/Fustat|web\.home\.hero|tokenColor\("(surface|accent)"\)/);
    expect(en.web.landing.hero.headline).toBeTruthy();
  });

  it("AR card is rendered with Alexandria, Coral tokens and the landing headline", () => {
    expect(script).toContain("Alexandria");
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
});
