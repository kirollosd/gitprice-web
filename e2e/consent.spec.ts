import { expect, test, type Page } from "@playwright/test";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

const N = en.web.component.webCookieNotice.default;
const COOKIES = en.web.component.webFooter.default.label.cookies;
const notice = (page: Page) => page.getByRole("region", { name: N.title });
const hasHeap = (page: Page) => page.evaluate(() => !!document.getElementById("heap") || "heap" in window);

test.beforeEach(async ({ page }) => {
  // Nothing may reach Heap's CDN; serve an empty script that still fires onload.
  await page.route("**/cdn.us.heap-api.com/**", (route) => route.fulfill({ contentType: "text/javascript", body: "" }));
});

test("no Heap and a visible notice before consent; Vercel Analytics is present", async ({ page }) => {
  await page.goto("/");
  await expect(notice(page)).toBeVisible();
  expect(await hasHeap(page)).toBe(false);
  await expect(page.locator('script[src*="_vercel/insights"]')).toHaveCount(1);
});

test("Allow loads Heap, Decline reloads and removes it and its cookies", async ({ page, context }) => {
  await page.goto("/");
  await notice(page).getByRole("button", { name: N.button.allow.label }).click();
  await expect(notice(page)).toBeHidden();
  await expect.poll(() => hasHeap(page)).toBe(true);
  await context.addCookies([{ name: "_hp2_id.e2e", value: "x", url: "http://localhost:3000" }]);

  await page.getByRole("button", { name: COOKIES }).click();
  await expect(notice(page)).toBeVisible();
  await expect(notice(page)).toBeFocused();
  await Promise.all([page.waitForEvent("load"), notice(page).getByRole("button", { name: N.button.decline.label }).click()]);

  expect(await hasHeap(page)).toBe(false);
  await expect(notice(page)).toBeHidden();
  const names = (await context.cookies()).map((c) => c.name);
  expect(names).toContain("gp_consent");
  expect(names.filter((n) => n.startsWith("_hp2_"))).toEqual([]);
});

test("Decline then Allow injects Heap without a reload", async ({ page }) => {
  await page.goto("/");
  await notice(page).getByRole("button", { name: N.button.decline.label }).click();
  expect(await hasHeap(page)).toBe(false);
  await page.evaluate(() => { (window as unknown as { marker: number }).marker = 1; });
  await page.getByRole("button", { name: COOKIES }).click();
  await notice(page).getByRole("button", { name: N.button.allow.label }).click();
  await expect.poll(() => hasHeap(page)).toBe(true);
  expect(await page.evaluate(() => (window as unknown as { marker?: number }).marker)).toBe(1);
});

test("choice persists across reloads", async ({ page }) => {
  await page.goto("/");
  await notice(page).getByRole("button", { name: N.button.decline.label }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: COOKIES })).toBeVisible();
  await expect(notice(page)).toBeHidden();
});

test("Arabic notice uses Arabic copy and keyboard reaches the buttons", async ({ page }) => {
  await page.goto("/ar");
  const a = ar.web.component.webCookieNotice.default;
  const region = page.getByRole("region", { name: a.title });
  await expect(region).toBeVisible();
  await region.getByRole("link", { name: a.label.privacy }).focus();
  await page.keyboard.press("Tab");
  await expect(region.getByRole("button", { name: a.button.decline.label })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(region.getByRole("button", { name: a.button.allow.label })).toBeFocused();
});

test.describe("with the Arabic suggestion banner", () => {
  test.use({ locale: "ar-EG" });
  test("notice and suggestion do not overlap", async ({ page }) => {
    await page.goto("/privacy");
    const banner = page.getByRole("region", { name: en.web.component.webLocaleSuggest.default.label });
    await expect(banner).toBeVisible();
    await expect(notice(page)).toBeVisible();
    const [a, b] = await Promise.all([banner.boundingBox(), notice(page).boundingBox()]);
    expect(a!.y + a!.height).toBeLessThanOrEqual(b!.y);
  });
});
