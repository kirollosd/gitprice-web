/** Incoming / outbound UTM bag. Convention keys are preferred; unknown `utm_*` keys pass through. */
export type UtmParams = Record<string, string>;

const UTM_PREFIX = "utm_";

/** Collects every non-empty `utm_*` query value from search params. */
export function parseUtms(params: URLSearchParams | { get: (name: string) => string | null; forEach?: (cb: (value: string, key: string) => void) => void }): UtmParams {
  const out: UtmParams = {};
  if (typeof params.forEach === "function") {
    params.forEach((value, key) => {
      if (key.startsWith(UTM_PREFIX) && value) out[key] = value;
    });
    return out;
  }
  // Fallback for sparse mocks that only implement get for known keys.
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id"]) {
    const value = params.get(key);
    if (value) out[key] = value;
  }
  return out;
}

/** Appends UTMs onto `base`, overwriting any matching existing query keys. Empty bag returns base unchanged. */
export function withUtms(base: string, utms: UtmParams): string {
  const entries = Object.entries(utms).filter(([, v]) => v);
  if (!entries.length) return base;
  const url = new URL(base);
  for (const [key, value] of entries) url.searchParams.set(key, value);
  return url.toString();
}

/** Chrome Web Store listing URL with UTMs applied. */
export function chromeStoreUrlWithUtms(chromeStoreUrl: string, utms: UtmParams): string {
  return withUtms(chromeStoreUrl, utms);
}
