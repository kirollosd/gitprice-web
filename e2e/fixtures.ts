import { test as base } from "@playwright/test";

export { expect } from "@playwright/test";
export type { Page } from "@playwright/test";

// The prelaunch build has GTM on (NEXT_PUBLIC_GTM_ID, GP-376). No spec may reach Google, so every context serves an empty script.
// A page.route in a spec (analytics.spec.ts) takes precedence over this context route.
export const test = base.extend({
  context: async ({ context }, provide) => {
    await context.route("https://www.googletagmanager.com/**", (r) => r.fulfill({ contentType: "text/javascript", body: "" }));
    // Vercel Speed Insights script is served by Vercel only; locally it 404s and trips the no-console-error specs.
    await context.route("**/_vercel/**", (r) => r.fulfill({ contentType: "text/javascript", body: "" }));
    // The landing shows a random product on load; specs assume the charger (the static HTML). A spec that tests the randomness overrides this.
    await context.addInitScript(() => { Math.random = () => 0; });
    await provide(context);
  },
});
