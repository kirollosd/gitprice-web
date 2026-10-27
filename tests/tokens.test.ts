import { describe, expect, it } from "vitest";
import { tokenColor } from "../lib/tokens";

describe("tokenColor reads the web blocks", () => {
  it("resolves shared names through --gp-web-* in light", () => {
    expect(tokenColor("surface")).toBe("#F4F4F5");
    expect(tokenColor("accent")).toBe("#C8261A");
    expect(tokenColor("ink")).toBe("#0A0A0B");
  });
  it("reads the dark web block", () => {
    expect(tokenColor("surface", "dark")).toBe("#0A0A0B");
    expect(tokenColor("accent", "dark")).toBe("#FF6F63");
  });
  it("throws on an unknown token", () => {
    expect(() => tokenColor("nope")).toThrow(/--gp-nope/);
  });
});
