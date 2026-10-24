import type { Metadata } from "next";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import HeapAnalytics from "./components/HeapAnalytics";
import { env } from "../lib/env";
import { dir, t } from "../lib/i18n";
import "./globals.css";

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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir={dir("en")} data-gp="app">
      <head>
        <link rel="preload" href="/fonts/fustat-latin-400-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
        <HeapAnalytics />
      </body>
    </html>
  );
}
