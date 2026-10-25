import { test } from "./fixtures";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";
import {
  decideConsent, divergedReason, expectFormParity, expectParity, isDiverged, LOCALES, seedCheckout, seedReset, seedWaitlist, sizeToBoard, spinnerMask, WIDTHS,
  type CheckoutState, type Mask, type ResetState, type Shot, type WaitlistState,
} from "./parity-lib";

// Prelaunch project (:3000). Launch-only boards live in parity.launch.spec.ts.
// The waitlist form is never masked. Home prelaunch boards diverge below the hero (DIVERGED), so each Home form state
// (empty, submitting, error, failed, joined; dark for empty, the only dark export) is compared on the form's own rectangle;
// Sellers prelaunch and prelaunch-joined compare the whole page. alreadyJoined has no board export.
// Not pixel-compared, no build counterpart: Pricing-default (the priced plans page, copy and price keys do not exist; the build ships only the no-prices page).
// Home prelaunch and cookie-notice are test.fixme: see DIVERGED in parity-lib.ts. Sellers and Home launch are compared without masks on the art.

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

    // ----- home and sellers prelaunch, waitlist form unmasked -----
    for (const [screen, path] of [["Home", "/"], ["Sellers", "/sellers"]] as const) {
      for (const cookieNotice of screen === "Home" ? [false, true] : [false]) {
        const state = cookieNotice ? "cookie-notice" : "prelaunch";
        const themes = !cookieNotice && screen === "Home" && darkOnly(width) ? (["light", "dark"] as const) : (["light"] as const);
        for (const theme of themes) {
          test(`${screen} ${state} ${tag} ${theme}`, async ({ page }) => {
            test.fixme(isDiverged(screen, state), divergedReason(screen, state));
            const s = shot(screen, state, width, locale, { theme });
            if (!cookieNotice) await decideConsent(page);
            await sizeToBoard(page, s);
            await page.goto(`${base}${path}`);
            await expectParity(page, s);
          });
        }
      }
    }

    // ----- Sellers prelaunch-joined: the hero form after a 201 -----
    test(`Sellers prelaunch-joined ${tag} light`, async ({ page }) => {
      const s = shot("Sellers", "prelaunch-joined", width, locale);
      await decideConsent(page);
      await sizeToBoard(page, s);
      await page.goto(`${base}/sellers`);
      await seedWaitlist(page, "joined", { error: "", filled: W.component.webWaitlistForm.failed.input.email.value }, W.sellers.prelaunch.hero.waitlist.button.submitLabel);
      await expectParity(page, s);
    });

    // ----- Home waitlist form states, compared on the form's rectangle -----
    const formStates: WaitlistState[] = ["empty", "submitting", "error", "failed", "joined"];
    for (const state of formStates) {
      const themes = state === "empty" && darkOnly(width) ? (["light", "dark"] as const) : (["light"] as const);
      for (const theme of themes) {
        test(`Home waitlist ${state} ${tag} ${theme}`, async ({ page }) => {
          const F = W.component.webWaitlistForm;
          const board = shot("Home", state === "empty" ? "prelaunch" : `prelaunch-${state}`, width, locale, { theme });
          await decideConsent(page);
          await sizeToBoard(page, board);
          await page.goto(`${base}/`);
          await seedWaitlist(page, state, { error: F.error.input.email.value, filled: F.submitting.input.email.value }, F.empty.button.submit.label);
          await expectFormParity(page, { ...board, state });
        });
      }
    }

    // ----- menu (390 only) -----
    if (width === 390) {
      test(`Menu open ${tag}`, async ({ page }) => {
        const s = shot("Menu-open", "", width, locale);
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
