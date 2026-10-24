import { expect, test, type Page } from "@playwright/test";

const TALLY_STUB = "window.Tally={loadEmbeds(){window.__tallyLoads=(window.__tallyLoads||0)+1}};";

/** Tests never reach tally.so: the script is a stub and anything else on that host is refused. */
async function stubTally(page: Page, { fail = false, onScript = () => {} } = {}) {
  await page.route("https://tally.so/**", (route) => {
    if (route.request().url().endsWith("/widgets/embed.js")) onScript();
    if (fail || !route.request().url().endsWith("/widgets/embed.js")) return route.abort();
    return route.fulfill({ contentType: "text/javascript", body: TALLY_STUB });
  });
}

test.describe("no horizontal overflow at 390", () => {
  test.use({ viewport: { width: 390, height: 800 } });
  for (const path of ["/", "/sellers", "/ar", "/ar/sellers"]) {
    test(path, async ({ page }) => {
      await stubTally(page);
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
      expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(390);
    });
  }
});

test.describe("Home prelaunch", () => {
  test("has the nav anchors and a waitlist embed with the page language", async ({ page }) => {
    await stubTally(page);
    await page.goto("/");
    for (const id of ["features", "how-it-works", "waitlist"]) await expect(page.locator(`#${id}`)).toHaveCount(1);
    const srcs = await page.locator("iframe[data-tally-src]").evaluateAll((els) => els.map((e) => e.getAttribute("data-tally-src")));
    expect(srcs.length).toBe(2);
    srcs.forEach((s) => expect(s).toMatch(/^https:\/\/tally\.so\/embed\/[^?]+\?transparentBackground=1&hideTitle=1&dynamicHeight=1&lang=en$/));
    await expect(page.getByRole("link", { name: "Add GitPrice to Chrome" })).toHaveCount(0);
  });

  test("Arabic passes lang=ar and is right to left", async ({ page }) => {
    await stubTally(page);
    await page.goto("/ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("iframe[data-tally-src]").first()).toHaveAttribute("data-tally-src", /lang=ar$/);
  });

  test("loads the Tally script once the page is idle and asks it to load the embeds", async ({ page }) => {
    await stubTally(page);
    await page.goto("/");
    await page.waitForFunction(() => (window as unknown as { __tallyLoads?: number }).__tallyLoads! >= 1);
  });

  test("two embeds on the page request embed.js once", async ({ page }) => {
    let requests = 0;
    await stubTally(page, { onScript: () => requests++ });
    await page.goto("/");
    await expect(page.locator("iframe[data-tally-src]")).toHaveCount(2);
    await page.waitForFunction(() => (window as unknown as { __tallyLoads?: number }).__tallyLoads! >= 1);
    expect(requests).toBe(1);
  });

  test("falls back to the hosted form link when the script cannot load", async ({ page }) => {
    await stubTally(page, { fail: true });
    await page.goto("/");
    const link = page.locator("#waitlist").getByRole("link", { name: "Join the waitlist" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", /^https:\/\/tally\.so\/r\/.+/);
    await expect(link).toHaveAttribute("target", "_blank");
  });

  test("nav CTA targets the waitlist and the sellers link opens Sellers", async ({ page }) => {
    await stubTally(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator("header").getByRole("link", { name: "Join the waitlist" })).toHaveAttribute("href", "/#waitlist");
    await page.locator("header").getByRole("link", { name: "GitPrice for marketplace sellers" }).click();
    await expect(page).toHaveURL(/\/sellers$/);
  });
});

test.describe("Sellers prelaunch", () => {
  test("shows the seller waitlist, and the nav points back to shoppers", async ({ page }) => {
    await stubTally(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/sellers");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Know which listings a rival undercuts.");
    await expect(page.locator("iframe[data-tally-src]").first()).toHaveAttribute("data-tally-src", /lang=en$/);
    const header = page.locator("header");
    await expect(header.getByRole("link", { name: "GitPrice for shoppers" })).toHaveAttribute("href", "/");
    await expect(header.getByRole("link", { name: "Join the waitlist" })).toHaveAttribute("href", "#waitlist");
  });

  test("uses the short back label at 1024", async ({ page }) => {
    await stubTally(page);
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto("/ar/sellers");
    await expect(page.locator("header").getByRole("link", { name: "للمتسوقين", exact: true })).toBeVisible();
  });
});
