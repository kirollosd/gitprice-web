import { expect, test } from "./fixtures";

const PAGES = ["/faq", "/privacy", "/terms", "/welcome", "/pricing"];

test.describe("390 wide", () => {
  test.use({ viewport: { width: 390, height: 800 } });
  for (const base of ["", "/ar"]) {
    for (const p of PAGES) {
      test(`no horizontal overflow on ${base}${p}`, async ({ page }) => {
        await page.goto(base + p);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
      });
    }
  }
});

test("privacy names Vercel and Heap, not Tally, and exposes hreflang + canonical", async ({ page }) => {
  await page.goto("/ar/privacy");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const body = await page.locator("main").innerText();
  for (const n of ["Vercel", "Heap"]) expect(body).toContain(n);
  expect(body).not.toContain("Tally");
  const hreflang = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((els) =>
    els.map((e) => [e.getAttribute("hreflang"), new URL(e.getAttribute("href")!).pathname]),
  );
  expect(hreflang).toEqual([["en", "/privacy"], ["ar", "/ar/privacy"], ["x-default", "/privacy"]]);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/ar\/privacy$/);
});

for (const p of ["/welcome", "/pricing", "/ar/welcome"]) {
  test(`${p} is noindex`, async ({ page }) => {
    await page.goto(p);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
}

test("indexable pages are not noindex and nothing links to pricing", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute("content", /noindex/);
  expect(await page.locator('a[href*="pricing"]').count()).toBe(0);
});

test("prelaunch pricing CTAs open the waitlist in the dock", async ({ page }) => {
  await page.goto("/ar/pricing");
  // The plan CTAs are buttons that open the dock form in place; the sellers row links to the sellers page (Pricing/no-prices board).
  await expect(page.locator("main article a")).toHaveCount(0);
  await expect(page.locator("main article button[data-join]")).toHaveCount(2);
  await page.locator("main article button[data-join]").first().click();
  await expect(page.locator('#dock input[type="email"]')).toBeFocused();
  await expect(page).toHaveURL(/\/ar\/pricing$/);
  await expect(page.locator("main aside a")).toHaveAttribute("href", "/ar/sellers");
});

test("sitemap and robots", async ({ request }) => {
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain("/ar/terms");
  expect(sm).not.toMatch(/pricing|welcome|checkout|reset-password/);
  expect(await (await request.get("/robots.txt")).text()).toMatch(/Sitemap: .*\/sitemap\.xml/);
});

test("non-Home pages keep the generated share image", async ({ page, request }) => {
  for (const [path, locale] of [["/sellers", "en"], ["/ar/privacy", "ar"]] as const) {
    await page.goto(path);
    for (const sel of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
      await expect(page.locator(sel), `${path} ${sel}`).toHaveAttribute("content", new RegExp(`/${locale}/opengraph-image$`));
    }
    const res = await request.get(`/${locale}/opengraph-image`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
    const png = await res.body();
    expect([png.readUInt32BE(16), png.readUInt32BE(20)], `${locale} card is 1200x630`).toEqual([1200, 630]);
  }
});

test(`/sellers header "How it works" lands on a landing section, and there is no separate Features item`, async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/sellers");
  const nav = page.locator("header nav");
  await expect(nav.getByRole("link", { name: /features/i })).toHaveCount(0);
  await nav.getByRole("link", { name: /how it works/i }).click();
  await expect(page).toHaveURL(/\/#how$/);
  await expect(page.locator("#how")).toBeInViewport();
});
