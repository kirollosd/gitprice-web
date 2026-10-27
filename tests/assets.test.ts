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
  it("preloads Outfit/Alexandria/JetBrains Mono only", () => {
    expect(fonts.length).toBe(6);
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
});
