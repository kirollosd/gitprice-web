export type RecoveryInput =
  | { kind: "implicit"; accessToken: string; refreshToken: string }
  | { kind: "otp"; tokenHash: string }
  | { kind: "error"; code: string }
  | { kind: "none" };

/** Reads a Supabase recovery link: implicit-flow fragment, `?token_hash=` (OTP), or an error on either. */
export function parseRecovery(search: string, hash: string): RecoveryInput {
  const q = new URLSearchParams(search);
  const h = new URLSearchParams(hash.replace(/^#/, ""));
  const error = h.get("error") || q.get("error");
  if (error) return { kind: "error", code: h.get("error_code") || q.get("error_code") || error };
  const accessToken = h.get("access_token");
  const refreshToken = h.get("refresh_token");
  if (accessToken && refreshToken) return { kind: "implicit", accessToken, refreshToken };
  const tokenHash = q.get("token_hash");
  if (tokenHash) return { kind: "otp", tokenHash };
  return { kind: "none" };
}

const MIN_PASSWORD_LENGTH = 8;
// Supabase Auth hashes with bcrypt, which only reads the first 72 bytes.
const MAX_PASSWORD_LENGTH = 72;

/** Same rule as the extension (`meetsPasswordRule`) and the Supabase project setting. */
export function validatePassword(pw: string): "ok" | "weak" {
  const ok = pw.length >= MIN_PASSWORD_LENGTH && pw.length <= MAX_PASSWORD_LENGTH && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw);
  return ok ? "ok" : "weak";
}
