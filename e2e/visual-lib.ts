import { expect, test, type Page } from "@playwright/test";

// Visual tests of the new site (GP-406): Playwright toHaveScreenshot against Linux Chromium baselines in e2e/visual-snapshots.
// Regenerate with `npm run visual:update` (needs docker); never on macOS.
export const SIZES = { 1440: { width: 1440, height: 900 }, 390: { width: 390, height: 844 } } as const;
export type Width = keyof typeof SIZES;
export const THEMES = ["light", "dark"] as const;

/** Rates.tsx picks the display currency from the time zone and navigator.language; pin both so prices never depend on the host (Cairo: EGP). */
export const PINNED = { timezoneId: "Africa/Cairo", locale: "en-US" } as const;

/**
 * Live regions (demo video frames, the receipt's current month) are hidden with CSS, not a locator mask: the full-page capture
 * resizes the viewport, the pinned scenes re-lay out, and a mask measured before that lands on the wrong pixels. Converted prices
 * are not live here: prepare() aborts the rate fetch, so they stay in EGP.
 */
const LIVE_CSS = "video { visibility: hidden !important; } #rmonth { color: transparent !important; }";

/** Consent decided (no cookie notice over the shot), rates unreachable (prices stay in EGP), nothing else leaves the page. */
export async function prepare(page: Page) {
  await page.context().addCookies([{ name: "gp_consent", value: "decline", url: String(test.info().project.use.baseURL) }]);
  await page.route(/cdn\.jsdelivr\.net|currency-api\.pages\.dev/, (r) => r.abort());
}

type Options = { fullPage?: boolean };

/** Waits for fonts and a blurred, settled page, then compares with the baseline. Animations are off (reduced motion + animations: disabled). */
export async function shoot(page: Page, name: string, { fullPage = false }: Options = {}) {
  await page.addStyleTag({ content: LIVE_CSS });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  if (fullPage) await settleLazy(page);
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage,
    // Viewport shots (dock, menu) guard small details, so they get a tight budget; full pages keep the config's looser one.
    ...(fullPage ? {} : { maxDiffPixelRatio: 0.002 }),
    animations: "disabled",
    caret: "hide",
  });
}

/** Scrolls to the bottom and back so scroll-triggered scenes (reduced motion: settled at once) have all run before the full-page capture. */
async function settleLazy(page: Page) {
  await page.evaluate(async () => {
    // Half-viewport steps with a pause: IntersectionObservers (poster loading, scene steps) report on a later frame, and a quick pass skips them.
    for (let y = 0; y <= document.documentElement.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 60))));
    }
    window.scrollTo(0, 0);
  });
  // DemoVideo sets the film's poster once it has been near the viewport; the scroll above must have reached it.
  await page.waitForFunction(() => { const f = document.getElementById("fframe"); return !f || !!f.style.getPropertyValue("--pd"); });
  // Posters are CSS backgrounds set once the film is near (DemoVideo); wait until every background and <img> has decoded.
  await page.evaluate(async () => {
    const urls = new Set<string>();
    for (const el of document.querySelectorAll("*")) {
      for (const m of getComputedStyle(el).backgroundImage.matchAll(/url\("?([^")]+)"?\)/g)) urls.add(m[1]);
    }
    await Promise.all([...urls].map((u) => { const i = new Image(); i.src = u; return i.decode().catch(() => undefined); }));
    await Promise.all([...document.images].map((i) => i.decode().catch(() => undefined)));
  });
  // The scene loops sleep 400 ms after the last input; wait until the layout height and the font load have held still for longer than that.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => {
    const w = window as unknown as { __h?: number; __since?: number };
    const h = document.documentElement.scrollHeight, now = performance.now();
    if (w.__h !== h) { w.__h = h; w.__since = now; }
    return now - (w.__since ?? now) > 700;
  }, undefined, { polling: 100 });
}
