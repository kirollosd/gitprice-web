import { expect, test } from "@playwright/test";

test("launched pricing sends both plans to the Chrome store", async ({ page }) => {
  await page.goto("/pricing");
  const hrefs = await page.locator("main a").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  expect(hrefs[0]).toBe("https://chromewebstore.example/gitprice");
  expect(hrefs).toContain("https://apps.example/gitprice");
  expect(hrefs).toContain("https://play.example/gitprice");
});
