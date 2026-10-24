import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // e2e builds the launch variant into its own dir so it can sit beside the prelaunch build.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
