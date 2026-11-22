import { expect, test } from "./fixtures";

const PAGES = ["/faq", "/stores", "/deals", "/privacy", "/terms", "/welcome", "/pricing"];

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

test("privacy describes processors by category, names no vendor (GP-521), and exposes hreflang + canonical", async ({ page }) => {
  await page.goto("/ar/privacy");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const body = await page.locator("main").innerText();
  for (const n of ["Vercel", "Heap", "Tally"]) expect(body).not.toContain(n);
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
  expect(sm).toContain("/ar/stores");
  expect(sm).toContain("/ar/deals");
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

// The e2e API host is fake and unreachable at build time, so /stores and /deals render their empty state: the page must still stand.
for (const [p, empty] of [["/stores", "The store list is not available right now."], ["/ar/stores", "قائمة المتاجر غير متاحة الآن."], ["/deals", "No deals right now."], ["/ar/deals", "لا توجد عروض الآن."]]) {
  test(`${p} shows the calm empty state when the API is down`, async ({ page }) => {
    await page.goto(p);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator("main")).toContainText(empty);
    // an API outage on the dynamic /deals page is logged and noindex; /stores stays indexable
    const robots = page.locator('meta[name="robots"]');
    if (p.endsWith("/deals")) await expect(robots).toHaveAttribute("content", /noindex/);
    else await expect(robots).not.toHaveAttribute("content", /noindex/);
  });
}

// /deals list chips. The e2e API host is fake, so the chips only render when a real or mocked deals API answers
// (PLAYWRIGHT_BASE_URL at a deployment, or a local build with NEXT_PUBLIC_API_BASE_URL at a mock): those tests skip otherwise.
test("/deals?list=__bad is still a 200 page, never an error", async ({ page }) => {
  const res = await page.goto("/deals?list=__bad");
  expect(res?.status()).toBe(200);
  await expect(page.locator("main h1")).toBeVisible();
  const all = page.locator('nav[aria-label="Filter by list"] a').first();
  // no API: no chips, and the outage render must not be indexable; with an API: All is selected
  if (await all.count()) await expect(all).toHaveAttribute("aria-current", "page");
  else await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test.describe("/deals list chips", () => {
  for (const [base, dir] of [["/deals", "ltr"], ["/ar/deals", "rtl"]] as const) {
    test(`${base}: chips filter by link, wrap without sideways scroll, 44px tap target, ${dir} order`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 800 });
      await page.goto(base);
      const nav = page.locator("main nav", { has: page.locator('a[href*="list="]') });
      test.skip((await nav.count()) === 0, "no deals API in this environment");
      const chips = nav.locator("a");
      expect(await nav.evaluate((n) => n.scrollWidth <= n.clientWidth)).toBe(true);
      for (const a of await chips.all()) {
        const pad = await a.evaluate((e) => parseFloat(getComputedStyle(e, "::after").height));
        expect(pad).toBeGreaterThanOrEqual(43.9);
      }
      // the first chip (All) sits at the reading start: right of the last chip in rtl, left in ltr
      const first = await chips.first().boundingBox();
      const last = await chips.last().boundingBox();
      if (first && last && Math.abs(first.y - last.y) < 4) expect(dir === "rtl" ? first.x > last.x : first.x < last.x).toBe(true);
      await expect(chips.first()).toHaveAttribute("aria-current", "page");
      // hit test: 6px above the chip is inside its 44px pad, so it still lands on the chip
      const box = (await chips.first().boundingBox())!;
      const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest("a")?.getAttribute("href"), [box.x + box.width / 2, box.y - 6]);
      expect(hit).toBe(await chips.first().getAttribute("href"));
      const target = chips.nth(1);
      const href = await target.getAttribute("href");
      await target.click();
      await expect(page).toHaveURL(new RegExp(`${href!.replace("?", "\\?")}$`));
      await expect(page.locator(`main nav a[href="${href}"]`)).toHaveAttribute("aria-current", "page");
    });
  }
});
