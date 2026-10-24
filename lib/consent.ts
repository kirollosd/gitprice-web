export type Consent = "allow" | "decline" | null;

export const CONSENT_COOKIE = "gp_consent";
export const CONSENT_EVENT = "gp:consent";
export const REOPEN_EVENT = "gp:cookie-settings";
const HEAP_COOKIE_PREFIX = "_hp2_";

export function readConsent(cookie: string): Consent {
  const hit = cookie.split(";").map((p) => p.trim()).find((p) => p.startsWith(`${CONSENT_COOKIE}=`));
  const value = hit?.slice(CONSENT_COOKIE.length + 1);
  return value === "allow" || value === "decline" ? value : null;
}

export function consentCookie(value: "allow" | "decline"): string {
  return `${CONSENT_COOKIE}=${value}; Max-Age=31536000; Path=/; SameSite=Lax; Secure`;
}

/**
 * Cookie strings that expire every Heap cookie, on the current host (no Domain) and on each
 * parent domain Heap may have set it on. Unknown suffixes like co.uk are ignored by the browser.
 */
export function heapCookieExpiries(cookie: string, hostname: string): string[] {
  const names = cookie
    .split(";")
    .map((p) => p.trim().split("=")[0])
    .filter((n) => n.startsWith(HEAP_COOKIE_PREFIX));
  const labels = hostname.split(".");
  const domains = labels.length > 1 ? labels.slice(0, -1).map((_, i) => labels.slice(i).join(".")) : [];
  return names.flatMap((n) => [
    `${n}=; Max-Age=0; Path=/`,
    ...domains.map((d) => `${n}=; Max-Age=0; Path=/; Domain=${d}`),
  ]);
}

/** Stores the choice and tells listeners. Allow then Decline drops Heap's cookies and reloads, since Heap cannot be unloaded. */
export function setConsent(value: "allow" | "decline"): void {
  const previous = readConsent(document.cookie);
  if (value === "decline" && previous === "allow") {
    const heap = (window as { heap?: { stopTracking?: () => void } }).heap;
    try { heap?.stopTracking?.(); } catch { /* best effort; the reload removes Heap anyway */ }
  }
  document.cookie = consentCookie(value);
  if (value === "decline" && previous === "allow") {
    heapCookieExpiries(document.cookie, location.hostname).forEach((c) => { document.cookie = c; });
    location.reload();
    return;
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}
