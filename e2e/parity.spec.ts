import { test } from "@playwright/test";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";
import {
  decideConsent, DIVERGED, expectParity, isDiverged, LOCALES, seedCheckout, seedReset, sizeToBoard, spinnerMask, stubTally, tallyMask, WIDTHS,
  type CheckoutState, type Mask, type ResetState, type Shot,
} from "./parity-lib";

// Prelaunch project (:3000). Launch-only boards live in parity.launch.spec.ts.
// Not pixel-compared, Tally draws these: Home and Sellers prelaunch-submitting, -joined, -error, -failed.
// Not pixel-compared, no build counterpart: Pricing-default (the priced plans page, copy and price keys do not exist; the build ships only the no-prices page).
// Home and Sellers are test.fixme: see DIVERGED in parity-lib.ts.

const COPY = { en: en.web, ar: ar.web };
type Locale = "en" | "ar";
const shot = (screen: string, state: string, width: (typeof WIDTHS)[number], locale: Locale, extra: Partial<Shot> = {}): Shot =>
  ({ screen, state, width, locale, ...extra });
const darkOnly = (width: number) => width === 1440;

// Total row: the board shows the "000" placeholder price, the build shows the real formatted price.
const totalRow: Mask = {
  locator: (p) => p.locator("dl > div").nth(1),
  reason: "total row: board shows the placeholder price 000, the build shows the formatted price",
};

for (const width of WIDTHS) {
  for (const [base, locale] of LOCALES) {
    const W = COPY[locale];
    const tag = `${width} ${locale}`;

    // ----- static pages -----
    const pages: [string, string, string, Mask[]?][] = [
      ["Welcome", "default", "/welcome"],
      ["Pricing", "no-prices", "/pricing"],
      ["Privacy", "default", "/privacy"],
      ["Terms", "default", "/terms"],
      ["NotFound", "default", "/nope"],
    ];
    for (const [screen, state, path, masks] of pages) {
      test(`${screen} ${state} ${tag}`, async ({ page }) => {
        const s = shot(screen, state, width, locale, { masks });
        await decideConsent(page);
        await sizeToBoard(page, s);
        await page.goto(`${base}${path}`);
        await expectParity(page, s);
      });
    }

    // ----- home and sellers: the waitlist embed is masked -----
    for (const [screen, path] of [["Home", "/"], ["Sellers", "/sellers"]] as const) {
      for (const cookieNotice of screen === "Home" ? [false, true] : [false]) {
        const state = cookieNotice ? "cookie-notice" : "prelaunch";
        const themes = !cookieNotice && screen === "Home" && darkOnly(width) ? (["light", "dark"] as const) : (["light"] as const);
        for (const theme of themes) {
          test(`${screen} ${state} ${tag} ${theme}`, async ({ page }) => {
            test.fixme(isDiverged(screen), DIVERGED[screen]);
            const s = shot(screen, state, width, locale, { theme, masks: [tallyMask] });
            await stubTally(page);
            if (!cookieNotice) await decideConsent(page);
            await sizeToBoard(page, s);
            await page.goto(`${base}${path}`);
            await expectParity(page, s);
          });
        }
      }
    }

    // ----- menu (390 only) -----
    if (width === 390) {
      test(`Menu open ${tag}`, async ({ page }) => {
        const s = shot("Menu-open", "", width, locale);
        await stubTally(page);
        await decideConsent(page);
        await sizeToBoard(page, s);
        await page.goto(`${base}/`);
        await page.locator("header button[aria-expanded]").click();
        await page.locator("#web-menu").waitFor();
        await expectParity(page, s);
      });
    }

    // ----- reset password -----
    const resetStates: ResetState[] = ["verifying", "set-new-password", "weak-password", "saving", "error", "success", "link-expired"];
    for (const state of resetStates) {
      const themes = state === "set-new-password" && darkOnly(width) ? (["light", "dark"] as const) : (["light"] as const);
      for (const theme of themes) {
        test(`ResetPassword ${state} ${tag} ${theme}`, async ({ page }) => {
          const s = shot("ResetPassword", state, width, locale, { theme, masks: state === "verifying" || state === "saving" ? [spinnerMask] : [] });
          await decideConsent(page);
          await sizeToBoard(page, s);
          await seedReset(page, state, base, W.resetPassword.field.label, W.resetPassword.button.label);
          await expectParity(page, s);
        });
      }
    }

    // ----- checkout -----
    const checkoutStates: CheckoutState[] = ["summary", "signed-out", "already-pro", "failed", "redirecting", "cancelled", "waiting", "success"];
    for (const state of checkoutStates) {
      const themes = state === "summary" && darkOnly(width) ? (["light", "dark"] as const) : (["light"] as const);
      for (const theme of themes) {
        test(`Checkout ${state} ${tag} ${theme}`, async ({ page }) => {
          const masks = state === "summary" ? [totalRow] : state === "redirecting" || state === "waiting" ? [spinnerMask] : [];
          const s = shot("Checkout", state === "already-pro" ? "already-pro" : state, width, locale, { theme, masks });
          await decideConsent(page);
          await sizeToBoard(page, s);
          await seedCheckout(page, state, base, W.checkout.summary.button.label);
          await expectParity(page, s);
        });
      }
    }
  }
}
