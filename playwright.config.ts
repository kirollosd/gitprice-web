import { defineConfig } from "@playwright/test";

// NEXT_PUBLIC_* is inlined at build time, so each launch mode needs its own build and server.
const PRELAUNCH = 3000;
const LAUNCH = 3001;
// Fake Supabase project and API host: the e2e specs stub every call and abort anything else.
const supabaseEnv = {
  NEXT_PUBLIC_API_BASE_URL: "https://api.example.test",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "e2e-anon-key",
};
const launchEnv = {
  ...supabaseEnv,
  NEXT_PUBLIC_LAUNCH: "1",
  NEXT_PUBLIC_CHROME_STORE_URL: "https://chromewebstore.example/gitprice",
  NEXT_PUBLIC_APP_STORE_URL: "https://apps.example/gitprice",
  NEXT_PUBLIC_PLAY_STORE_URL: "https://play.example/gitprice",
  NEXT_DIST_DIR: ".next-launch",
};

// A stale `next start` on :3000 or :3001 is reused outside CI; kill it first or you test old code.
export default defineConfig({
  testDir: "e2e",
  projects: [
    { name: "prelaunch", testIgnore: /\.launch\.spec\.ts$/, use: { baseURL: `http://localhost:${PRELAUNCH}` } },
    { name: "launch", testMatch: /\.launch\.spec\.ts$/, use: { baseURL: `http://localhost:${LAUNCH}` } },
  ],
  webServer: [
    {
      command: `npm run build && npm run start -- -p ${PRELAUNCH}`,
      url: `http://localhost:${PRELAUNCH}`,
      env: { ...supabaseEnv, NEXT_PUBLIC_HEAP_ID: "e2e-heap" },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: `npm run build && npm run start -- -p ${LAUNCH}`,
      url: `http://localhost:${LAUNCH}`,
      env: launchEnv,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
