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
          const menu = page.locator("header button[aria-expanded]:not(#lng)"); // #lng is the landing's language menu
          const links = page.locator("header nav");
          if (route === "/") {
            // the landing header has no menu sheet: five anchors from 1024, the dock carries the CTA below
            await expect(menu).toHaveCount(0);
            if (width >= 1024) await expect(links).toBeVisible();
            else await expect(links).toBeHidden();
          } else if (HOSTED.test(route)) {
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

// the dock's phone rules key on the viewport, not the landing's html.lp-m, so site pages fit too (open form included)
for (const w of [360, 390]) {
  for (const path of ["/privacy", "/ar/pricing"]) {
    test(`the dock fits the ${w}px viewport on ${path}, closed and open`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 800 });
      await page.goto(path);
      const fits = () => page.locator("#dock").evaluate((d, vw) => { const r = d.getBoundingClientRect(); return r.left >= 0 && r.right <= vw; }, w);
      await expect(page.locator("#dock")).toHaveClass(/\bin\b/);
      expect(await fits()).toBe(true);
      await page.locator("#dgo").click();
      await expect(page.locator('#dock input[type="email"]')).toBeVisible();
      expect(await fits()).toBe(true);
    });
  }
}
