import { expect, test } from "./fixtures";

// 1024 and 768 are layout-only checks (no pixel parity): no horizontal scroll, and the right nav variant.
const ROUTES = ["/", "/sellers", "/pricing", "/welcome", "/privacy", "/terms", "/reset-password", "/checkout", "/checkout/return", "/nope"];
const HOSTED = /^\/(reset-password|checkout|welcome)/; // logo and language switch only

for (const width of [1024, 768]) {
  test.describe(`${width} wide`, () => {
    test.use({ viewport: { width, height: 800 } });
    for (const base of ["", "/ar"]) {
      for (const route of ROUTES) {
        test(`${base}${route}`, async ({ page }) => {
          await page.route(/supabase\.co|api\.example\.test/, (r) => r.abort());
          await page.goto(`${base}${route}`);
          await expect(page.locator("h1").first()).toBeVisible();
          expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
          const menu = page.locator("header button[aria-expanded]");
          const links = page.locator("header nav");
          if (HOSTED.test(route)) {
            await expect(menu).toHaveCount(0);
            await expect(links).toHaveCount(0);
          } else if (width >= 1024) {
            await expect(menu).toBeHidden();
            await expect(links).toBeVisible();
          } else {
            // 768 keeps the sellers link inline next to the menu button.
            await expect(menu).toBeVisible();
          }
        });
      }
    }
  });
}
