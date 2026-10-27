import { expect, test } from "./fixtures";

// Runs against the NEXT_PUBLIC_LAUNCH=1 build (see playwright.config.ts).
const CHROME = "https://chromewebstore.example/gitprice";

test.describe("launch mode", () => {
  test("Home offers Add to Chrome in the hero, the dock and the foot, and no waitlist form", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.locator("form[data-waitlist]")).toHaveCount(0);
    await expect(page.locator("[data-join]")).toHaveCount(0);
    for (const where of ["#num", "#dock", "#foot"]) {
      const link = page.locator(`${where} a[data-gp-store="chrome"]`); // the dock is visibility:hidden until it shows, so no role query
      await expect(link, where).toHaveCount(1);
      await expect(link, where).toHaveAttribute("href", CHROME);
    }
    const links = page.locator('a[data-gp-store="chrome"]');
    expect(await links.count()).toBeGreaterThanOrEqual(4); // header, hero, dock, foot
    for (const href of await links.evaluateAll((els) => els.map((e) => e.getAttribute("href")))) expect(href).toBe(CHROME);
  });

  test("phase 1 is extension only: no App Store or Google Play badge on Home or /pricing, at 390 or 1440", async ({ page }) => {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      for (const path of ["/", "/pricing"]) {
        await page.goto(path);
        await expect(page.locator('a[data-gp-store="app_store"], a[data-gp-store="play"]'), `${path} @${width}`).toHaveCount(0);
        await expect(page.locator('a[href^="https://apps.example"], a[href^="https://play.example"]'), `${path} @${width}`).toHaveCount(0);
      }
    }
  });

  test("the Beta tag sits by the hero CTA, the dock CTA and in the footer", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator("#num [data-beta]")).toHaveCount(1);
    await expect(page.locator("#dock [data-beta]")).toHaveCount(1);
    await expect(page.locator("footer [data-beta]")).toHaveCount(1);
  });

  test("Sellers offers seller access instead of the waitlist", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/sellers");
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Get seller access" }).first()).toHaveAttribute("href", CHROME);
  });

  for (const path of ["/", "/sellers", "/ar", "/ar/sellers"]) {
    test(`no horizontal overflow at 390 on ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 800 });
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    });
  }
});
