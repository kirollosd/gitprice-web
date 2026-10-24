import type { MetadataRoute } from "next";
import { INDEXABLE_PATHS, absoluteUrl } from "../lib/seo";
import { LOCALES } from "../lib/locale";

export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_PATHS.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: absoluteUrl(locale, path),
      alternates: { languages: { en: absoluteUrl("en", path), ar: absoluteUrl("ar", path) } },
    })),
  );
}
