import { expect, test } from "./fixtures";

test.use({ viewport: { width: 390, height: 800 } });

// The landing header has no hamburger (the mock's); the other pages keep the phone menu sheet.
for (const path of ["/", "/ar"]) {
  test(`${path}: no hamburger, and no overflow with the language menu open`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("header button[aria-expanded]:not(#lng)")).toHaveCount(0);
    await page.locator("#lng").click();
    await expect(page.locator("#lmenu")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });
}

for (const path of ["/sellers", "/ar/sellers", "/privacy"]) {
  test(`no horizontal overflow at 390 on ${path}, menu closed and open`, async ({ page }) => {
    await page.goto(path);
    const width = () => page.evaluate(() => document.documentElement.scrollWidth);
    expect(await width()).toBe(390);
    const btn = page.locator("header button[aria-expanded]:not(#lng)");
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
  await page.locator("header #lng").click();
  await page.locator("header").getByRole("link", { name: "العربية" }).click();
  await expect(page).toHaveURL(/\/ar\/privacy$/);
  await page.locator("header #lng").click();
  await page.locator("header").getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
});

test("unknown path renders localized not-found with 404", async ({ page }) => {
  const res = await page.goto("/ar/nope");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "الصفحة غير موجودة" })).toBeVisible();
});

test("the same button opens and closes the menu by click", async ({ page }) => {
  await page.goto("/sellers");
  const btn = page.locator("header button[aria-expanded]:not(#lng)");
  await btn.click();
  await expect(page.locator("#web-menu")).toBeVisible();
  await expect(page.locator("#web-menu a").first()).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await btn.click();
  await expect(page.locator("#web-menu")).toBeHidden();
  await expect(btn).toHaveAttribute("aria-expanded", "false");
  await expect(btn).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("growing the viewport to 1280 closes the open menu", async ({ page }) => {
  await page.goto("/sellers");
  const btn = page.locator("header button[aria-expanded]:not(#lng)");
  await btn.click();
  await expect(btn).toHaveAttribute("aria-expanded", "true");
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(btn).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#web-menu")).toHaveCount(0);
});

for (const [path, label] of [["/", "Skip to content"], ["/ar/nope", "انتقل إلى المحتوى"]] as const) {
  test(`first Tab on ${path} shows the skip link, which moves focus to main`, async ({ page }) => {
    await page.goto(path);
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: label });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
  });
}
