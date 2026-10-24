import { test as base } from "@playwright/test";

export { expect } from "@playwright/test";
export type { Page } from "@playwright/test";

// The prelaunch build has GTM on (NEXT_PUBLIC_GTM_ID, GP-376). No spec may reach Google, so every context serves an empty script.
// A page.route in a spec (analytics.spec.ts) takes precedence over this context route.
export const test = base.extend({
  context: async ({ context }, provide) => {
    await context.route("https://www.googletagmanager.com/**", (r) => r.fulfill({ contentType: "text/javascript", body: "" }));
    await provide(context);
  },
});
