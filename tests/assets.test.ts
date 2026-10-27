import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..");
// ponytail: local until app/landing/products.ts exists (Task 4).
const IDS = ["charger", "iphone", "cerave", "airfryer", "pampers"];

// PRELOAD is not exported (Next rejects extra layout exports), so read it from source.
const layout = readFileSync(join(root, "app/[locale]/layout.tsx"), "utf8");
const preload = layout.match(/const PRELOAD[^=]*=\s*\{([\s\S]*?)\n\};/)?.[1] ?? "";
const fonts = [...preload.matchAll(/"([a-z0-9-]+-normal)"/g)].map((m) => m[1]);

describe("self-hosted assets", () => {
  it("preloads Outfit/Alexandria only", () => {
    expect(fonts.length).toBe(7);
    expect(fonts.filter((f) => /fustat|noto/.test(f))).toEqual([]);
  });
  it("every PRELOAD font exists in public/fonts", () => {
    for (const f of fonts) expect(existsSync(join(root, "public/fonts", `${f}.woff2`)), f).toBe(true);
  });
  it("every landing media file exists in public/media", () => {
    for (const id of IDS)
      for (const m of ["", "-m"])
        for (const look of ["coral", "coral-light"]) {
          const base = `demo-${id}${m}-${look}`;
          expect(existsSync(join(root, "public/media", `${base}.mp4`)), base).toBe(true);
          expect(existsSync(join(root, "public/media", `${base}-poster.jpg`)), `${base} poster`).toBe(true);
        }
  });

  it("every @font-face src in globals.css exists in public/ and the new families match the tokens", () => {
    const css = readFileSync(join(root, "app/globals.css"), "utf8");
    for (const m of css.matchAll(/url\("(\/[^"]+)"\)/g)) expect(existsSync(join(root, "public", m[1])), m[1]).toBe(true);
    const families = new Set([...css.matchAll(/@font-face\s*\{[^}]*?font-family:\s*"([^"]+)"/g)].map((m) => m[1]));
    for (const f of ["Outfit", "Alexandria", "JetBrains Mono"]) expect(families, f).toContain(f);
    // ponytail: legacy GP Fustat / Noto faces stay while synced tokens.css (app block) and the OG renderers still use them.
    expect([...families].filter((f) => f.startsWith("GP ") && f !== "GP Fustat")).toEqual([]);
  });
});
