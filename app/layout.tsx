import type { Metadata } from "next";
import localFont from "next/font/local";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import "./globals.css";

const sora = localFont({
  src: [
    {
      path: "../public/fonts/sora-latin.woff2",
      style: "normal",
    },
    {
      path: "../public/fonts/sora-latin-ext.woff2",
      style: "normal",
    },
  ],
  weight: "400 700",
  display: "swap",
  variable: "--font-sora",
});

const karla = localFont({
  src: [
    {
      path: "../public/fonts/karla-latin.woff2",
      style: "normal",
    },
    {
      path: "../public/fonts/karla-latin-ext.woff2",
      style: "normal",
    },
  ],
  weight: "400 600",
  display: "swap",
  variable: "--font-karla",
});

export const metadata: Metadata = {
  title: {
    template: "%s — GitPrice",
    default: "GitPrice — Price Comparison for Egypt",
  },
  description:
    "GitPrice automatically compares product prices across Amazon.eg, Noon, and Jumia as you browse. Find the best deal without lifting a finger.",
  keywords: ["price comparison", "Egypt", "Amazon.eg", "Noon", "Jumia", "best price", "deals"],
  authors: [{ name: "GitPrice" }],
  creator: "GitPrice",
  metadataBase: new URL("https://kirollosd.github.io/gitprice-web"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://kirollosd.github.io/gitprice-web",
    siteName: "GitPrice",
    title: "GitPrice — Price Comparison for Egypt",
    description:
      "Automatically compare prices across Amazon.eg, Noon, and Jumia as you browse. Never overpay again.",
    images: [
      {
        url: "/logo_og.png",
        width: 1200,
        height: 630,
        alt: "GitPrice — Price Comparison for Egypt",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GitPrice — Price Comparison for Egypt",
    description:
      "Automatically compare prices across Amazon.eg, Noon, and Jumia as you browse.",
  },
  icons: {
    icon: [
      { url: "/gitprice-web/favicon.ico", sizes: "any" },
      { url: "/gitprice-web/logo_icon.svg", type: "image/svg+xml" },
    ],
    apple: "/gitprice-web/logo_icon.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} ${karla.variable}`}>
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
