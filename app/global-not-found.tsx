import type { Metadata } from "next";
import { headers } from "next/headers";
import NotFound from "./[locale]/not-found";
import WebFooter from "./components/WebFooter";
import SkipLink from "./components/SkipLink";
import WebNav from "./components/WebNav";
import { dir, t, type Locale } from "../lib/i18n";
import { fullTitle } from "../lib/seo";
import { readToneConfig, THEME_BOOT, toneCss } from "../lib/theme";
import "./globals.css";

// With one root layout per locale (no app/layout), Next cannot server-render [locale]/not-found for an unmatched
// path; this page is the full document instead. The middleware passes the locale it routed to as x-gp-locale.
async function locale(): Promise<Locale> {
  return (await headers()).get("x-gp-locale") === "ar" ? "ar" : "en";
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: fullTitle(t(await locale(), "web.notFound.title")), robots: { index: false, follow: false } };
}

export default async function GlobalNotFound() {
  const l = await locale();
  const tone = toneCss(readToneConfig());
  return (
    <html lang={l} dir={dir(l)} data-gp="web" suppressHydrationWarning>
      <head>
        {/* Same theme boot and tone as [locale]/layout; a plain script since this document is not the root layout. */}
        <script id="gp-theme" dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        {tone ? <style id="gp-tone">{tone}</style> : null}
      </head>
      <body>
        <SkipLink locale={l} />
        <WebNav locale={l} />
        <main id="main" tabIndex={-1}>
          <NotFound />
        </main>
        <WebFooter locale={l} />
      </body>
    </html>
  );
}
