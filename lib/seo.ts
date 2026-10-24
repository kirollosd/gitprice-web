import type { Metadata } from "next";
import { env } from "./env";
import type { Locale } from "./i18n";
import { pathFor } from "./locale";

/** Pages that appear in the sitemap. */
export const INDEXABLE_PATHS = ["/", "/sellers", "/privacy", "/terms"] as const;

/** Unlisted or hosted pages: noindex, never in the sitemap. Reset-password and checkout pages import this. */
export const NOINDEX_PATHS = ["/pricing", "/welcome", "/reset-password", "/checkout", "/checkout/return"] as const;

/** The English root is the bare origin (no trailing slash), matching what Next renders for canonical and og:url. */
export const absoluteUrl = (locale: Locale, path: string) => {
  const p = pathFor(locale, path);
  return env.siteUrl.replace(/\/+$/, "") + (p === "/" ? "" : p);
};

export const SITE_NAME = "GitPrice";
/** Title template shared by the layout and the share cards (Next applies the template to <title> only). */
export const fullTitle = (title: string) => `${title} | ${SITE_NAME}`;
export const OG_LOCALE: Record<Locale, string> = { en: "en_US", ar: "ar_AR" };
/** The generated share card ([locale]/opengraph-image): one per locale, the same for every page. */
export const OG_IMAGE = { width: 1200, height: 630, type: "image/png", alt: SITE_NAME } as const;
export const ogImage = (locale: Locale) => ({ url: `${env.siteUrl.replace(/\/+$/, "")}/${locale}/opengraph-image`, ...OG_IMAGE });

type PageOpts = { noindex?: boolean; title?: string; description?: string };

/**
 * Per-page head: canonical, hreflang, robots, and the share cards. A page-level `openGraph` or `twitter` replaces the
 * layout's whole object (the file-convention image included), so every field is set here, the image too.
 */
export function pageMeta(locale: Locale, path: string, opts: PageOpts = {}): Metadata {
  const { title, description } = opts;
  const card = { ...(title ? { title: fullTitle(title) } : {}), ...(description ? { description } : {}) };
  return {
    // absolute: the layout template does not reach a page in the layout's own segment (Home), so apply it here.
    ...(title ? { title: { absolute: fullTitle(title) } } : {}),
    ...(description ? { description } : {}),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale],
      alternateLocale: OG_LOCALE[locale === "ar" ? "en" : "ar"],
      url: absoluteUrl(locale, path),
      images: [ogImage(locale)],
      ...card,
    },
    twitter: { card: "summary_large_image", images: [ogImage(locale)], ...card },
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
