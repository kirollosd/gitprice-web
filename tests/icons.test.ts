import { readFileSync } from "node:fs";
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
});
