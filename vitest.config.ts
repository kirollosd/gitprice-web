import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    // lib/env.ts evaluates `env` on import, so give it valid prelaunch values.
    env: {
      NEXT_PUBLIC_TALLY_FORM_ID: "test",
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:8080",
      NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    },
  },
});
