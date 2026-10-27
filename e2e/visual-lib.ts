import { expect, test, type Locator, type Page } from "@playwright/test";

// Visual tests of the new site (GP-406): Playwright toHaveScreenshot against Linux Chromium baselines in e2e/visual-snapshots.
// Regenerate with `npm run visual:update` (needs docker); never on macOS.
export const SIZES = { 1440: { width: 1440, height: 900 }, 390: { width: 390, height: 844 } } as const;
export type Width = keyof typeof SIZES;
export const THEMES = ["light", "dark"] as const;

/** Rates.tsx picks the display currency from the time zone and navigator.language; pin both so prices never depend on the host (Cairo: EGP). */
export const PINNED = { timezoneId: "Africa/Cairo", locale: "en-US" } as const;

/** Regions that change between runs: demo video frames, converted (live-rate) prices, the receipt's current month. */
const volatile = (page: Page): Locator[] => [page.locator("video"), page.locator("[data-egp], [data-cur]"), page.locator("#rmonth")];

/** Consent decided (no cookie notice over the shot), rates unreachable (prices stay in EGP), nothing else leaves the page. */
export async function prepare(page: Page) {
  await page.context().addCookies([{ name: "gp_consent", value: "decline", url: String(test.info().project.use.baseURL) }]);
  await page.route(/cdn\.jsdelivr\.net|currency-api\.pages\.dev/, (r) => r.abort());
}

type Options = { fullPage?: boolean };

/** Waits for fonts and a blurred, settled page, then compares with the baseline. Animations are off (reduced motion + animations: disabled). */
export async function shoot(page: Page, name: string, { fullPage = false }: Options = {}) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  if (fullPage) await settleLazy(page);
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage,
    // Viewport shots (dock, menu) guard small details, so they get a tight budget; full pages keep the config's looser one.
    ...(fullPage ? {} : { maxDiffPixelRatio: 0.002 }),
    animations: "disabled",
    caret: "hide",
    mask: volatile(page),
    maskColor: "#ff00ff",
  });
}

/** Scrolls to the bottom and back so scroll-triggered scenes (reduced motion: settled at once) have all run before the full-page capture. */
async function settleLazy(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y <= document.documentElement.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }
    window.scrollTo(0, 0);
  });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}
