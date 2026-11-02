import type { NextConfig } from "next";

// Hosted pages carry one-time tokens in the URL, so they must never leak it through Referer.
const hosted = ["/reset-password", "/ar/reset-password", "/auth/:path*", "/ar/auth/:path*", "/checkout", "/checkout/:path*", "/ar/checkout", "/ar/checkout/:path*"];

// www is served by the same deployment; vercel.json's host redirect never reached the prerendered `/`, so it lives here.
const www = [{ type: "host" as const, value: "www.gitprice.com" }];

const nextConfig: NextConfig = {
  // e2e builds the launch variant into its own dir so it can sit beside the prelaunch build.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // app/global-not-found.tsx: the 404 document for a site whose root layouts are per locale.
  experimental: { globalNotFound: true },
  async redirects() {
    return [
      { source: "/", has: www, destination: "https://gitprice.com/", permanent: true },
      { source: "/:path*", has: www, destination: "https://gitprice.com/:path*", permanent: true },
    ];
  },
  async headers() {
    const rule = (source: string, value: string) => ({ source, headers: [{ key: "Referrer-Policy", value }] });
    // Site-wide default first; the hosted rules after it win for the same header.
    return [rule("/:path*", "strict-origin-when-cross-origin"), ...hosted.map((source) => rule(source, "no-referrer"))];
  },
};

export default nextConfig;
