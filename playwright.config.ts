import { defineConfig } from "@playwright/test";

// NEXT_PUBLIC_* is inlined at build time, so each launch mode needs its own build and server.
const PRELAUNCH = 3000;
const LAUNCH = 3001;
const launchEnv = {
  NEXT_PUBLIC_LAUNCH: "1",
  NEXT_PUBLIC_CHROME_STORE_URL: "https://chromewebstore.example/gitprice",
  NEXT_PUBLIC_APP_STORE_URL: "https://apps.example/gitprice",
  NEXT_PUBLIC_PLAY_STORE_URL: "https://play.example/gitprice",
  NEXT_DIST_DIR: ".next-launch",
};

export default defineConfig({
  testDir: "e2e",
  projects: [
    { name: "prelaunch", testIgnore: /\.launch\.spec\.ts$/, use: { baseURL: `http://localhost:${PRELAUNCH}` } },
    { name: "launch", testMatch: /\.launch\.spec\.ts$/, use: { baseURL: `http://localhost:${LAUNCH}` } },
  ],
  webServer: [
    { command: `npm run build && npm run start -- -p ${PRELAUNCH}`, url: `http://localhost:${PRELAUNCH}`, reuseExistingServer: true, timeout: 180_000 },
    {
      command: `npm run build && npm run start -- -p ${LAUNCH}`,
      url: `http://localhost:${LAUNCH}`,
      env: launchEnv,
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});
