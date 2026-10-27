import { test } from "./fixtures";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";
import {
  decideConsent, expectParity, LOCALES, seedCheckout, seedReset, sizeToBoard, spinnerMask, WIDTHS,
  type CheckoutState, type Mask, type ResetState, type Shot,
} from "./parity-lib";

// Prelaunch project (:3000), pages the coral redesign (GP-406) did not touch: Pricing, Privacy, Terms, NotFound, ResetPassword, Checkout.
// The redesigned pages (Home, Sellers, Menu open) and the screens whose boards no longer matched (Welcome, ResetPassword link-expired,
// Checkout success) are covered by visual.spec.ts against baselines of the new site; their board PNGs were removed.
// Not pixel-compared, no build counterpart: Pricing-default (the priced plans page; the build ships only the no-prices page).

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

    // ----- reset password -----
    const resetStates: ResetState[] = ["verifying", "set-new-password", "weak-password", "saving", "error", "success"];
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
    const checkoutStates: CheckoutState[] = ["summary", "signed-out", "already-pro", "failed", "redirecting", "cancelled", "waiting"];
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
