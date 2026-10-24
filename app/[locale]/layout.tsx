import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HeapAnalytics from "../components/HeapAnalytics";
import LocaleSuggestion from "../components/LocaleSuggestion";
import WebFooter from "../components/WebFooter";
import WebNav from "../components/WebNav";
import { env } from "../../lib/env";
import { dir, t, type Locale } from "../../lib/i18n";
import "../globals.css";

const title = "GitPrice";
const description = t("en", "web.home.hero.sub");

export const metadata: Metadata = {
  title: { template: "%s | GitPrice", default: title },
  description,
  authors: [{ name: "GitPrice" }],
  creator: "GitPrice",
  metadataBase: new URL(env.siteUrl),
  openGraph: {
    type: "website",
    siteName: "GitPrice",
    title,
    description,
    images: [{ url: "/logo_og.png", width: 1200, height: 630, alt: "GitPrice" }],
  },
  twitter: { card: "summary_large_image", title, description },
  icons: {
    icon: [{ url: "/logo_icon.svg", type: "image/svg+xml" }],
    apple: "/logo_icon.svg",
  },
  robots: { index: true, follow: true },
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
        <link rel="preload" href="/fonts/fustat-latin-400-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <LocaleSuggestion />
        <WebNav locale={l} />
        <main>{children}</main>
        <WebFooter locale={l} />
        <HeapAnalytics />
      </body>
    </html>
  );
}
