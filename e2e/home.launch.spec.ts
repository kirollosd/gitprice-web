import { expect, test } from "@playwright/test";

// Runs against the NEXT_PUBLIC_LAUNCH=1 build (see playwright.config.ts).
const CHROME = "https://chromewebstore.example/gitprice";

test.describe("launch mode", () => {
  test("Home offers Add to Chrome and no waitlist form", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator("iframe")).toHaveCount(0);
    const links = page.getByRole("link", { name: "Add GitPrice to Chrome" });
    expect(await links.count()).toBeGreaterThanOrEqual(3); // nav, hero, closing band
    for (const href of await links.evaluateAll((els) => els.map((e) => e.getAttribute("href")))) expect(href).toBe(CHROME);
  });

  test("App Store and Google Play badges show at 390 only", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/");
    const store = page.getByRole("link", { name: /App Store/ }).first();
    await expect(store).toBeVisible();
    await expect(store).toHaveAttribute("href", "https://apps.example/gitprice");
    await expect(page.getByRole("link", { name: /Google Play/ }).first()).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(store).toBeHidden();
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
