import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import Analytics from "../components/Analytics";
import CookieNotice from "../components/CookieNotice";
import FloatingStack from "../components/FloatingStack";
import TrackListeners from "../components/TrackListeners";
import LocaleSuggestion from "../components/LocaleSuggestion";
import WebFooter from "../components/WebFooter";
import SkipLink from "../components/SkipLink";
import WebNav from "../components/WebNav";
import { env } from "../../lib/env";
import { consentDefaultScript, gtmScript } from "../../lib/gtm";
import { dir, t, type Locale } from "../../lib/i18n";
import { fullTitle, OG_LOCALE, SITE_NAME } from "../../lib/seo";
import { tokenColor } from "../../lib/tokens";
import "../globals.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l: Locale = locale === "ar" ? "ar" : "en";
  const description = t(l, "web.home.hero.sub");
  // Pages replace openGraph/twitter through pageMeta; these defaults only reach pages without one (404).
  return {
    title: { template: fullTitle("%s"), default: SITE_NAME },
    description,
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    metadataBase: new URL(env.siteUrl),
    openGraph: { type: "website", siteName: SITE_NAME, locale: OG_LOCALE[l], title: SITE_NAME, description },
    twitter: { card: "summary_large_image", title: SITE_NAME, description },
    icons: {
      // The theme-aware SVG first; the PNG is for browsers and crawlers that skip SVG icons.
      icon: [
        { url: "/logo_icon.svg", type: "image/svg+xml" },
        { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: tokenColor("surface", "light") },
    { media: "(prefers-color-scheme: dark)", color: tokenColor("surface", "dark") },
  ],
};

const PRELOAD: Record<Locale, string[]> = {
  en: ["outfit-latin-400-normal", "outfit-latin-800-normal", "jetbrains-mono-latin-400-normal"],
  ar: ["alexandria-arabic-400-normal", "alexandria-arabic-700-normal", "jetbrains-mono-latin-400-normal"],
};

export const dynamicParams = false;
export const generateStaticParams = () => [{ locale: "en" }, { locale: "ar" }];

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (locale !== "en" && locale !== "ar") notFound();
  const l: Locale = locale;
  return (
    <html lang={l} dir={dir(l)} data-gp="app">
      <head>
        {/* Consent Mode v2: denied by default, ahead of the GTM loader. beforeInteractive only works from the root layout, not a client component. */}
        {env.gtmId && process.env.NODE_ENV === "production" ? (
          <>
            <Script id="gtm-consent" strategy="beforeInteractive">{consentDefaultScript()}</Script>
            <Script id="gtm" strategy="afterInteractive">{gtmScript(env.gtmId)}</Script>
          </>
        ) : null}
        {/* Every weight the first screen uses, so the cookie notice and headings do not reflow on a font swap (CLS). */}
        {PRELOAD[l].map((f) => (
          <link key={f} rel="preload" href={`/fonts/${f}.woff2`} as="font" type="font/woff2" crossOrigin="anonymous" />
        ))}
      </head>
      <body>
        <SkipLink locale={l} />
        <WebNav locale={l} />
        {/* Fixed at the bottom, but first after the header in DOM and tab order so keyboard users meet the notice early. */}
        <FloatingStack>
          <LocaleSuggestion />
          <CookieNotice locale={l} />
        </FloatingStack>
        <main id="main" tabIndex={-1}>{children}</main>
        <WebFooter locale={l} />
        <Analytics />
        <TrackListeners />
      </body>
    </html>
  );
}
