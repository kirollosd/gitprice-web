import { describe, expect, it } from "vitest";
import { formatPrice } from "../lib/price";

const expected = (l: string, currency: string, major: number) => new Intl.NumberFormat(l, { style: "currency", currency }).format(major);

describe("formatPrice", () => {
  it.each([["en"], ["ar"]] as const)("EGP has 2 minor digits (%s)", (l) => expect(formatPrice(l, 9900, "EGP")).toBe(expected(l, "EGP", 99)));
  it.each([["en"], ["ar"]] as const)("JPY has 0 minor digits (%s)", (l) => expect(formatPrice(l, 500, "JPY")).toBe(expected(l, "JPY", 500)));
  it.each([["en"], ["ar"]] as const)("KWD has 3 minor digits (%s)", (l) => expect(formatPrice(l, 12345, "KWD")).toBe(expected(l, "KWD", 12.345)));
  it("never mis-scales: 9900 EGP is not 0.99 or 9900", () => {
    expect(formatPrice("en", 9900, "EGP")).not.toMatch(/0\.99|9,900/);
  });
  it("throws on an invalid currency code", () => expect(() => formatPrice("en", 100, "??")).toThrow());
  it("throws on a non-finite amount", () => expect(() => formatPrice("en", NaN, "EGP")).toThrow());
});
