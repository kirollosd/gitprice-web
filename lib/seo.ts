import type { Metadata } from "next";
import { env } from "./env";
import type { Locale } from "./i18n";
import { pathFor } from "./locale";

/** Pages that appear in the sitemap. */
export const INDEXABLE_PATHS = ["/", "/sellers", "/privacy", "/terms"] as const;

/** Unlisted or hosted pages: noindex, never in the sitemap. Reset-password and checkout pages import this. */
export const NOINDEX_PATHS = ["/pricing", "/welcome", "/reset-password", "/checkout", "/checkout/return"] as const;

export const absoluteUrl = (locale: Locale, path: string) =>
  env.siteUrl.replace(/\/+$/, "") + pathFor(locale, path);

export function pageMeta(locale: Locale, path: string, opts: { noindex?: boolean } = {}): Metadata {
  return {
    alternates: {
      canonical: absoluteUrl(locale, path),
      languages: {
        en: absoluteUrl("en", path),
        ar: absoluteUrl("ar", path),
        "x-default": absoluteUrl("en", path),
      },
    },
    ...(opts.noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
