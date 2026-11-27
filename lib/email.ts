const MAX_EMAIL = 254;

/** The waitlist / send-to-desktop rule: trimmed, at most 254 bytes, no spaces or control characters, one @, a local part, and a dotted domain that neither starts nor ends with a dot. */
export function isValidEmail(raw: string): boolean {
  const email = raw.trim();
  if (!email || new TextEncoder().encode(email).length > MAX_EMAIL) return false;
  if (/[\u0000-\u0020\u007f]/.test(email)) return false;
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  return local.length > 0 && domain.includes(".") && !domain.startsWith(".") && !domain.endsWith(".");
}
