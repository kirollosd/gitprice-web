import { describe, expect, it } from "vitest";
import { parseRecovery, validatePassword } from "../lib/recovery";

describe("parseRecovery", () => {
  it("reads the implicit-flow fragment", () => {
    expect(parseRecovery("", "#access_token=a&refresh_token=r&type=recovery")).toEqual({ kind: "implicit", accessToken: "a", refreshToken: "r" });
  });
  it("reads token_hash for the OTP flow", () => {
    expect(parseRecovery("?token_hash=h&type=recovery", "")).toEqual({ kind: "otp", tokenHash: "h" });
  });
  it("reads a Supabase error from the fragment or the query", () => {
    expect(parseRecovery("", "#error=access_denied&error_code=otp_expired")).toEqual({ kind: "error", code: "otp_expired" });
    expect(parseRecovery("?error=access_denied", "")).toEqual({ kind: "error", code: "access_denied" });
  });
  it("returns none for an empty or incomplete URL", () => {
    expect(parseRecovery("", "")).toEqual({ kind: "none" });
    expect(parseRecovery("", "#access_token=a")).toEqual({ kind: "none" });
  });
  it("prefers the fragment tokens when both forms are present", () => {
    expect(parseRecovery("?token_hash=h", "#access_token=a&refresh_token=r")).toEqual({ kind: "implicit", accessToken: "a", refreshToken: "r" });
  });
  it("prefers an error over tokens", () => {
    expect(parseRecovery("?token_hash=h", "#error=access_denied").kind).toBe("error");
  });
});

describe("validatePassword", () => {
  it("accepts 8-72 chars with lower, upper and digit", () => {
    expect(validatePassword("Abcdef12")).toBe("ok");
    expect(validatePassword("Aa1" + "x".repeat(69))).toBe("ok");
  });
  it("rejects short, long and missing classes", () => {
    for (const pw of ["Abcde12", "abcdefg1", "ABCDEFG1", "Abcdefgh", "", "Aa1" + "x".repeat(70)]) expect(validatePassword(pw)).toBe("weak");
  });
});
