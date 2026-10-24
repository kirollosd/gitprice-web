import { expect, test } from "@playwright/test";

test("launched pricing sends both plans to the Chrome store", async ({ page }) => {
  await page.goto("/pricing");
  const hrefs = await page.locator("main a").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  expect(hrefs[0]).toBe("https://chromewebstore.example/gitprice");
  expect(hrefs).toContain("https://apps.example/gitprice");
  expect(hrefs).toContain("https://play.example/gitprice");
});

// Launch day ships without Pro: NEXT_PUBLIC_CHECKOUT is off on this build, so the checkout pages do not exist.
for (const path of ["/checkout", "/checkout/return", "/ar/checkout", "/ar/checkout/return"]) {
  test(`${path} is a 404 while checkout is off`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(404);
  });
}
