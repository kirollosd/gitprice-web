import { describe, expect, it } from "vitest";
import { isPhoneUserAgent } from "../lib/device";

describe("isPhoneUserAgent", () => {
  it.each([
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15", true],
    ["Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Mobile Safari/537.36", true],
    ["Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36", true],
    ["Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15", false],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15", false],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", false],
    ["", false],
  ])("%j -> %s", (ua, expected) => {
    expect(isPhoneUserAgent(ua)).toBe(expected);
  });

  it("treats coarse pointer + narrow viewport as phone when UA is ambiguous", () => {
    expect(
      isPhoneUserAgent("Mozilla/5.0 SomeBot", { coarsePointer: true, maxTouchPoints: 5, viewportWidth: 390 }),
    ).toBe(true);
  });

  it("keeps desktop when coarse pointer is wide (tablet / touch laptop)", () => {
    expect(
      isPhoneUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", {
        coarsePointer: true,
        maxTouchPoints: 10,
        viewportWidth: 1280,
      }),
    ).toBe(false);
  });

  it("does not flip a desktop UA to phone from hints alone without coarse+narrow", () => {
    expect(
      isPhoneUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)", {
        coarsePointer: false,
        maxTouchPoints: 0,
        viewportWidth: 390,
      }),
    ).toBe(false);
  });
});
