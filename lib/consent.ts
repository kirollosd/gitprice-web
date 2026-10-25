import { gtag } from "./gtm";
export type Consent = "allow" | "decline" | null;

export const CONSENT_COOKIE = "gp_consent";
export const CONSENT_EVENT = "gp:consent";
export const REOPEN_EVENT = "gp:cookie-settings";
export const ANALYTICS_COOKIE_PREFIXES = ["_hp2_", "_ga", "_gid"] as const;

export function readConsent(cookie: string): Consent {
  const hit = cookie.split(";").map((p) => p.trim()).find((p) => p.startsWith(`${CONSENT_COOKIE}=`));
  const value = hit?.slice(CONSENT_COOKIE.length + 1);
  return value === "allow" || value === "decline" ? value : null;
}

export function consentCookie(value: "allow" | "decline"): string {
  return `${CONSENT_COOKIE}=${value}; Max-Age=31536000; Path=/; SameSite=Lax; Secure`;
}

/**
 * Cookie strings that expire every cookie starting with one of the prefixes, on the current host (no Domain),
 * the hostname itself and each parent domain with at least two labels (never a bare TLD).
 */
export function cookieExpiries(cookie: string, hostname: string, prefixes: readonly string[]): string[] {
  const names = cookie
    .split(";")
    .map((p) => p.trim().split("=")[0])
    .filter((n) => prefixes.some((p) => n.startsWith(p)));
  const labels = hostname.split(".");
  const domains = labels.length > 1 ? labels.slice(0, -1).map((_, i) => labels.slice(i).join(".")) : [];
  return names.flatMap((n) => [
    `${n}=; Max-Age=0; Path=/`,
    ...domains.map((d) => `${n}=; Max-Age=0; Path=/; Domain=${d}`),
  ]);
}

/**
 * Stores the choice and tells listeners. Decline always drops Heap and Google cookies; Allow then Decline also
 * reloads, since Heap cannot be unloaded.
 */
export function setConsent(value: "allow" | "decline"): void {
  const previous = readConsent(document.cookie);
  const revoking = value === "decline" && previous === "allow";
  if (revoking) {
    const heap = (window as { heap?: { stopTracking?: () => void } }).heap;
    try { heap?.stopTracking?.(); } catch { /* best effort; the reload removes Heap anyway */ }
  }
  document.cookie = consentCookie(value);
  gtag("consent", "update", { analytics_storage: value === "allow" ? "granted" : "denied" });
  if (value === "decline") {
    cookieExpiries(document.cookie, location.hostname, ANALYTICS_COOKIE_PREFIXES).forEach((c) => { document.cookie = c; });
  }
  if (revoking) {
    location.reload();
    return;
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}
