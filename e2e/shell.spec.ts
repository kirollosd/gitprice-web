import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 800 } });

for (const path of ["/", "/ar"]) {
  test(`no horizontal overflow at 390 on ${path}, menu closed and open`, async ({ page }) => {
    await page.goto(path);
    const width = () => page.evaluate(() => document.documentElement.scrollWidth);
    expect(await width()).toBe(390);
    const btn = page.locator("header button[aria-expanded]");
    await btn.click();
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#web-menu")).toBeVisible();
    expect(await width()).toBe(390);
    await page.keyboard.press("Escape");
    await expect(btn).toHaveAttribute("aria-expanded", "false");
    await expect(btn).toBeFocused();
  });
}

test("language switch keeps the page and flips locale", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/privacy");
  await page.locator("header").getByRole("link", { name: "العربية" }).click();
  await expect(page).toHaveURL(/\/ar\/privacy$/);
  await page.locator("header").getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
});

test("unknown path renders localized not-found with 404", async ({ page }) => {
  const res = await page.goto("/ar/nope");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "الصفحة غير موجودة" })).toBeVisible();
});
