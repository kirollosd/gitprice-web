import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    // the first test in a file that renders the whole landing pays its cold import under a parallel run
    testTimeout: 20000,
    // lib/env.ts evaluates `env` on import, so give it valid prelaunch values.
    env: {
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:8080",
      NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      // Rates picks the currency from the time zone: pin it so example prices read EGP on any machine
      TZ: "Africa/Cairo",
    },
  },
});
