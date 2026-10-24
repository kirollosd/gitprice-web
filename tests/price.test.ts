import { describe, expect, it } from "vitest";
import { formatPrice } from "../lib/price";

describe("formatPrice", () => {
  it("EGP has 2 minor digits", () => expect(formatPrice("en", 9900, "EGP")).toMatch(/99\.00/));
  it("JPY has 0 minor digits", () => expect(formatPrice("en", 500, "JPY")).toMatch(/500(?!\.)/));
  it("KWD has 3 minor digits", () => expect(formatPrice("en", 12345, "KWD")).toMatch(/12\.345/));
  it("uses ar formats 99", () => expect(formatPrice("ar", 9900, "EGP").replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))).toMatch(/99/));
  it("falls back on a bad currency code", () => expect(formatPrice("en", 100, "??")).toBe("100 ??"));
});
