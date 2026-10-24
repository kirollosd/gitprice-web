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

// PLAYWRIGHT_BASE_URL points every project at an already-deployed site (a Vercel preview) and skips the local servers.
// The deployment's own launch mode decides which project applies: run `--project=prelaunch` or `--project=launch`.
const REMOTE = process.env.PLAYWRIGHT_BASE_URL;
// SKIP_PARITY drops the pixel-parity specs (CI's functional job): baselines are board exports, not Linux renders.
const noParity = process.env.SKIP_PARITY ? [/parity/] : [];
// Vercel previews can sit behind Deployment Protection; global-setup.ts trades the bypass secret for a cookie on that origin only.
const storageState = REMOTE && process.env.VERCEL_BYPASS_SECRET ? "e2e/.auth/bypass.json" : undefined;
const baseFor = (port: number) => REMOTE ?? `http://localhost:${port}`;

// A stale `next start` on :3000 or :3001 is reused outside CI; kill it first or you test old code.
export default defineConfig({
  testDir: "e2e",
  // Parity baselines are the board exports in e2e/refs, copied (and masked) into e2e/.parity by each test.
  snapshotPathTemplate: "{testDir}/.parity/{arg}{ext}",
  globalSetup: "./e2e/global-setup.ts",
  // threshold 0.1 (default 0.2) so small colour and token shifts show up; the ratio budget is per test.
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02, threshold: 0.1 } },
  projects: [
    { name: "prelaunch", testIgnore: [/\.launch\.spec\.ts$/, ...noParity], use: { baseURL: baseFor(PRELAUNCH), storageState } },
    { name: "launch", testMatch: /\.launch\.spec\.ts$/, testIgnore: noParity, use: { baseURL: baseFor(LAUNCH), storageState } },
  ],
  webServer: REMOTE ? undefined : [
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
