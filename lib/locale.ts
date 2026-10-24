import type { Locale } from "./i18n";

export const LOCALES: Locale[] = ["en", "ar"];

/** Takes a pathname only (no query string). */
export function localeFromPath(pathname: string): { locale: Locale; rest: string } {
  if (pathname === "/ar" || pathname.startsWith("/ar/")) {
    return { locale: "ar", rest: pathname.slice(3) || "/" };
  }
  return { locale: "en", rest: pathname };
}

export function pathFor(locale: Locale, rest: string): string {
  if (locale === "en") return rest;
  return rest === "/" ? "/ar" : `/ar${rest}`;
}

const Q = /^q=(0(\.\d{1,3})?|1(\.0{1,3})?)$/i;

/** Best q per primary language subtag; null if the header is malformed. */
function bestQ(header: string): Map<string, number> | null {
  const best = new Map<string, number>();
  for (const part of header.split(",")) {
    const [tag, ...params] = part.trim().split(";").map((s) => s.trim());
    if (!/^([a-z]{1,8}(-[a-z0-9]{1,8})*|\*)$/i.test(tag) || params.length > 1) return null;
    let q = 1;
    if (params.length === 1) {
      if (!Q.test(params[0])) return null;
      q = Number(params[0].slice(2));
    }
    const lang = tag.split("-")[0].toLowerCase();
    best.set(lang, Math.max(best.get(lang) ?? 0, q));
  }
  return best;
}

/** 'ar' only when the visitor is on English and ar's best q strictly beats en's. Never a redirect. */
export function suggestLocale(acceptLanguage: string | null, current: Locale): Locale | null {
  if (current !== "en" || !acceptLanguage) return null;
  const q = bestQ(acceptLanguage);
  if (!q) return null;
  return (q.get("ar") ?? 0) > (q.get("en") ?? 0) ? "ar" : null;
}

// Middleware rewrites English paths to /en/..., so the server sees that prefix too.
const HOSTED = /^(\/en)?\/(reset-password|checkout)(\/|$)/;

/** Takes the locale-less path (`localeFromPath(...).rest`). Hosted pages carry secrets in the URL and show a minimal shell. */
export const isHostedPath = (rest: string) => HOSTED.test(rest);

/** Target URL when switching language. Hosted pages carry secrets in the hash, so it is dropped there. */
export function switchPath(pathname: string, hash: string, to: Locale): string {
  const { rest } = localeFromPath(pathname);
  return pathFor(to, rest) + (isHostedPath(rest) ? "" : hash);
}
