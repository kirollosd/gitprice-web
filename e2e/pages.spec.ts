import { expect, test } from "./fixtures";

const PAGES = ["/privacy", "/terms", "/welcome", "/pricing"];

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

test("privacy names Vercel, Tally and Heap and exposes hreflang + canonical", async ({ page }) => {
  await page.goto("/ar/privacy");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const body = await page.locator("main").innerText();
  for (const n of ["Vercel", "Tally", "Heap"]) expect(body).toContain(n);
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

test("prelaunch pricing CTAs go to the waitlist", async ({ page }) => {
  await page.goto("/ar/pricing");
  // The plan CTAs; the sellers row links to the sellers page (Pricing/no-prices board).
  const hrefs = await page.locator("main article a").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  expect(hrefs).toEqual(["/ar#waitlist", "/ar#waitlist"]);
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
  }
});
