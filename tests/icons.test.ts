import { readFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const f = (n: string) => readFileSync(`public/${n}`);
const png = (n: string) => ({ w: f(n).readUInt32BE(16), h: f(n).readUInt32BE(20) });

describe("favicon set is Coral", () => {
  it("the SVG mark has no legacy navy and uses the Coral tile", () => {
    const svg = f("logo_icon.svg").toString("utf8");
    expect(svg).not.toMatch(/2D415E/i);
    expect(svg).toContain("#FF5A4E");
  });
  it("PNG icons exist at their declared sizes", () => {
    expect(png("icon-32.png")).toEqual({ w: 32, h: 32 });
    expect(png("apple-touch-icon.png")).toEqual({ w: 180, h: 180 });
  });
  it("favicon.ico holds 16, 32 and 48 PNG images", () => {
    const ico = f("favicon.ico");
    expect(ico.readUInt16LE(2)).toBe(1);
    const n = ico.readUInt16LE(4);
    const sizes = Array.from({ length: n }, (_, i) => ico[6 + 16 * i]);
    expect(sizes).toEqual([16, 32, 48]);
    for (let i = 0; i < n; i++) expect(ico.subarray(ico.readUInt32LE(6 + 16 * i + 12) , ico.readUInt32LE(6 + 16 * i + 12) + 4).toString("hex")).toBe("89504e47");
  });

  // the SVG pin above does not cover the raster files, which could revert to the legacy navy unnoticed
  const colours = async (img: Buffer) => {
    const { data, info } = await sharp(img).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const seen = new Set<string>();
    for (let i = 0; i < data.length; i += 4) if (data[i + 3] === 255) seen.add(data.subarray(i, i + 3).toString("hex"));
    expect(info.channels).toBe(4);
    return seen;
  };
  const ico = () => {
    const b = f("favicon.ico");
    return Array.from({ length: b.readUInt16LE(4) }, (_, i) => b.subarray(b.readUInt32LE(6 + 16 * i + 12), b.readUInt32LE(6 + 16 * i + 12) + b.readUInt32LE(6 + 16 * i + 8)));
  };
  it.each(["icon-32.png", "apple-touch-icon.png"])("%s paints the Coral tile and no legacy navy", async (n) => {
    const seen = await colours(f(n));
    expect(seen.has("ff5a4e")).toBe(true);
    expect(seen.has("2d415e")).toBe(false);
  });
  it("every favicon.ico image paints the Coral tile and no legacy navy", async () => {
    for (const img of ico()) {
      const seen = await colours(img);
      expect(seen.has("ff5a4e")).toBe(true);
      expect(seen.has("2d415e")).toBe(false);
    }
  });
});
