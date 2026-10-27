import { expect, test, type Page } from "./fixtures";
import ar from "../i18n/ar.json";
import en from "../i18n/en.json";

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 800 };
const NAV = (l: typeof en) => l.web.component.webNav;

const formFocused = (page: Page) => expect(page.locator('#dock input[type="email"]')).toBeFocused();

for (const [locale, base, L] of [["en", "", en], ["ar", "/ar", ar]] as const) {
  const home = base || "/";
  test.describe(`${locale}: links from a site page into the landing`, () => {
    test("desktop header: one How it works link (no Features), and the CTA lands on the landing with the dock form focused", async ({ page }) => {
      await page.setViewportSize(DESKTOP);
      await page.goto(`${base}/pricing`);
      const nav = page.locator("header nav");
      await expect(nav.getByRole("link", { name: NAV(L)["1024"].label.features })).toHaveCount(0);
      await expect(nav.locator('a[data-gp-cta-id="features"]')).toHaveCount(0);
      await expect(nav.getByRole("link", { name: NAV(L)["1024"].label.howItWorks })).toHaveAttribute("href", `${base || "/"}#how`);
      await nav.getByRole("link", { name: NAV(L)["1024"].label.howItWorks }).click();
      await expect(page).toHaveURL(new RegExp(`${base}/?#how$`));
      await expect(page.locator("#how")).toBeInViewport();

      await page.goto(`${base}/pricing`);
      const cta = page.locator('header a[data-gp-cta-id="join_waitlist"]');
      await expect(cta).toHaveAttribute("href", `${base || "/"}#join`);
      await cta.click();
      await expect(page.locator("#dock")).toHaveClass(/(^|\s)in(\s|$)/);
      await formFocused(page);
      await expect(page).toHaveURL(new RegExp(`${home === "/" ? "/" : home}$`));
    });

    test("phone menu sheet: How it works and the CTA reach the landing; the CTA opens the dock form with focus", async ({ page }) => {
      await page.setViewportSize(PHONE);
      await page.goto(`${base}/privacy`);
      await page.locator("header button[aria-expanded]").click();
      const sheet = page.locator("#web-menu");
      await expect(sheet.locator('a[data-gp-cta-id="features"]')).toHaveCount(0);
      await expect(sheet.locator('a[data-gp-cta-id="how_it_works"]')).toHaveAttribute("href", `${base || "/"}#how`);
      await sheet.locator('a[data-gp-cta-id="how_it_works"]').click();
      await expect(page).toHaveURL(new RegExp(`${base}/?#how$`));

      await page.goto(`${base}/privacy`);
      await page.locator("header button[aria-expanded]").click();
      await page.locator('#web-menu a[data-gp-cta-id="join_waitlist"]').click();
      await formFocused(page);
    });

    test("a #join URL opens the dock form with the email field focused", async ({ page }) => {
      await page.setViewportSize(DESKTOP);
      await page.goto(`${base}/#join`);
      await expect(page.locator("#dock form[data-waitlist]")).toBeVisible();
      await formFocused(page);
      expect(new URL(page.url()).hash).toBe("");
    });
  });
}

test.describe("Beta tag placement", () => {
  const visible = (page: Page, sel: string) => page.locator(sel).evaluateAll((els) => els.filter((e) => (e as HTMLElement).getClientRects().length > 0).length);

  test("phone: the header carries the tag, the hidden hero CTA's tag does not show; desktop: the hero does, the header does not", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/");
    expect(await visible(page, "header [data-beta]")).toBe(1);
    expect(await visible(page, "#num [data-beta]")).toBe(0);
    await page.setViewportSize(DESKTOP);
    await page.reload();
    expect(await visible(page, "header [data-beta]")).toBe(0);
    expect(await visible(page, "#num [data-beta]")).toBe(1);
  });

  for (const viewport of [DESKTOP, PHONE]) {
    test(`${viewport.width}: the dock keeps its Beta tag while the join form is open`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/#join");
      await expect(page.locator("#dock form[data-waitlist]")).toBeVisible();
      await expect(page.locator("#dock [data-beta]")).toBeVisible();
      const [d, b] = await Promise.all([page.locator("#dock").boundingBox(), page.locator("#dock [data-beta]").boundingBox()]);
      expect(b!.x).toBeGreaterThanOrEqual(d!.x);
      expect(b!.x + b!.width).toBeLessThanOrEqual(d!.x + d!.width);
    });
  }
});

test.describe("dock and the cookie notice never overlap", () => {
  const overlap = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
    a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

  for (const path of ["/", "/ar"]) {
    for (const width of [390, 800, 1024, 1100, 1279, 1280, 1440, 1920]) {
      for (const form of [false, true]) {
        test(`${path} at ${width}${form ? " with the form open" : ""}`, async ({ page }) => {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(form ? `${path}#join` : path);
          const notice = page.getByRole("region", { name: (path === "/" ? en : ar).web.component.webCookieNotice.default.title });
          await expect(notice).toBeVisible();
          if (!form) await page.evaluate(() => document.getElementById("film")!.scrollIntoView());
          const dock = page.locator("#dock");
          await expect(dock).toHaveClass(/(^|\s)in(\s|$)/);
          await expect.poll(async () => {
            const [d, n] = await Promise.all([dock.boundingBox(), notice.boundingBox()]);
            return !overlap(d!, n!) && d!.x >= 0 && d!.x + d!.width <= width + 0.5;
          }).toBe(true);
        });
      }
    }
  }

  test("1440: with the notice showing the dock sits beside it, still 32px up (not lifted)", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-gp-stack", "side");
    expect(await page.locator("#dock").evaluate((e) => getComputedStyle(e).bottom)).toBe("32px");
  });

  test("1440: after consent the dock is centred again", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/");
    await page.getByRole("region", { name: en.web.component.webCookieNotice.default.title }).getByRole("button").first().click();
    await page.evaluate(() => document.getElementById("film")!.scrollIntoView());
    await expect(page.locator("#dock")).toHaveClass(/(^|\s)in(\s|$)/);
    await expect.poll(async () => { const d = await page.locator("#dock").boundingBox(); return Math.round(d!.x + d!.width / 2); }).toBe(720);
  });
});
