import { expect, test } from "./fixtures";
import { waitlistReply, seedCheckout, seedReset } from "./parity-lib";
import { prepare, shoot, SIZES, THEMES, type Width } from "./visual-lib";
import type { Page } from "@playwright/test";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

// Prelaunch build (:3000, or the preview when its mode is prelaunch). Launch states: visual.launch.spec.ts.
test.use({ reducedMotion: "reduce" });

const PAGES = [["home", "/"], ["home-ar", "/ar"], ["sellers", "/sellers"], ["privacy", "/privacy"]] as const;
const WIDTHS = Object.keys(SIZES).map(Number) as Width[];
const L = en.web.landing;
const W = en.web.component.webWaitlistForm;

for (const width of WIDTHS) {
  for (const colorScheme of THEMES) {
    test.describe(`${width} ${colorScheme}`, () => {
      test.use({ viewport: SIZES[width], colorScheme });
      test.beforeEach(({ page }) => prepare(page));

      for (const [name, path] of PAGES) {
        test(`${name} full page`, async ({ page }) => {
          await page.goto(path);
          await shoot(page, `prelaunch-${name}-${width}-${colorScheme}`, { fullPage: true });
        });
      }

      // ----- the waitlist dock: open, error, failed, joined -----
      const dockCases = [
        ["open", null, ""], ["error", null, W.error.input.email.value], ["failed", 503, "sara@example.com"], ["joined", 201, "sara@example.com"],
      ] as const;
      for (const [state, status, email] of dockCases) {
        test(`dock ${state}`, async ({ page }) => {
          await page.route("**/api/v1/waitlist", (r) => r.fulfill(waitlistReply(status ?? 201)));
          await page.goto("/");
          await openDock(page);
          if (state !== "open") {
            await page.locator("#dock form[data-waitlist]").getByLabel(W.empty.input.email.label).fill(email);
            await page.locator("#dock").getByRole("button", { name: L.dock.submit, exact: true }).click();
            if (state === "joined") await expect(page.locator("#dt")).toHaveText(L.dock.done); // the dock hides again on desktop; the hero buttons read joined
            else await page.locator("#dock [data-waitlist]").waitFor();
          }
          await shoot(page, `prelaunch-dock-${state}-${width}-${colorScheme}`);
        });
      }

      // ----- the site header menu on a non-landing page (the landing header has no hamburger) -----
      if (width === 390) {
        for (const [name, path] of [["menu", "/sellers"], ["menu-ar", "/ar/sellers"]] as const) {
          test(`${name} open on ${path}`, async ({ page }) => {
            await page.goto(path);
            await page.locator('header button[aria-expanded]').click();
            await page.locator("#web-menu").waitFor();
            await shoot(page, `prelaunch-${name}-${width}-${colorScheme}`);
          });
        }
      }
    });
  }
}

/** Opens the dock form from the first visible Join button (the hero's on desktop, the header's on a phone). */
async function openDock(page: Page) {
  await page.locator("[data-join]:visible").first().click();
  await page.locator("#dock form[data-waitlist]").waitFor();
}

// ----- pages moved out of the Sketch parity suite (their board exports no longer matched): light, both locales and widths -----
for (const width of WIDTHS) {
  for (const [base, locale, C] of [["", "en", en.web], ["/ar", "ar", ar.web]] as const) {
    test.describe(`${width} ${locale} moved screens`, () => {
      test.use({ viewport: SIZES[width] });
      test.beforeEach(({ page }) => prepare(page));
      test("welcome", async ({ page }) => {
        await page.goto(`${base}/welcome`);
        await shoot(page, `prelaunch-welcome-${width}-${locale}`, { fullPage: true });
      });
      test("reset-password link expired", async ({ page }) => {
        await seedReset(page, "link-expired", base, C.resetPassword.field.label, C.resetPassword.button.label);
        await shoot(page, `prelaunch-reset-link-expired-${width}-${locale}`);
      });
      test("checkout success", async ({ page }) => {
        await seedCheckout(page, "success", base, C.checkout.summary.button.label);
        await shoot(page, `prelaunch-checkout-success-${width}-${locale}`);
      });
    });
  }
}
