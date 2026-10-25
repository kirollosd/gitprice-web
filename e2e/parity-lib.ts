import { expect, test, type Locator, type Page } from "@playwright/test";
import { appendFileSync, copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

// Visual parity against the Sketch board exports in e2e/refs (<Screen>-<state>-<width>-<locale>-<theme>.png).
// Run `PARITY_MEASURE=1` to record each diff ratio to test-results/parity-ratios.jsonl instead of failing.
// Coverage gap: every board draws the header sellers toggle and both e2e builds set NEXT_PUBLIC_SELLERS_NAV=1, so no parity
// board or e2e build covers the production default (flag off, toggle hidden); only tests/sellers-nav.test.tsx and tests/env.test.ts do.

const REFS = join(__dirname, "refs");
const BASELINES = join(__dirname, ".parity");
const MASK_RGB = { r: 255, g: 0, b: 255 }; // Playwright's default mask colour
export const WIDTHS = [1440, 390] as const;
export const LOCALES = [["", "en"], ["/ar", "ar"]] as const;

/**
 * Per-screen tolerances above the 0.02 default, each with the reason. Key: `<Screen>-<state>-<width>`.
 * Playwright reports ratios to two decimals, so each value is the measured ratio plus one point of headroom.
 */
const NOTE = "board draws the 'Prices are placeholders' note (a copy key the build must never render); its absence moves the button and card edge up";
const TEXT = "~5000px of body text: Sketch and Chromium rasterise Fustat differently, and a one-pixel line-height drift accumulates down the page";
const NOBTN = "board draws an action button the build omits by design (no web target; e2e asserts no actions)";
const FIELD = "board draws the Show/Hide password toggle and the 'At least 8 characters' hint; both need new i18n keys, so they are not built";
const RASTER = "Sketch and Chromium rasterise short centred card text differently; measured 0.03 at per-pixel threshold 0.1, no layout offset found";
// Home and Sellers (GP-372 boards, art rebuilt in HTML/CSS, never masked):
// Per-section deltas are build minus board block-start/size (Sketch frames vs Playwright boxes, en, 2026-10-24); the art is never masked.
const ART = "art text and the product photo rasterise differently in Sketch and Chromium; the CTA card is 56px shorter because the store badges are hidden at >=768 per owner ruling (board card 132, build 76)";
const BANDS = "the board's closing band runs past its card (1440: 122px, 390: 136px; build 72) and the footer then sits 48 below it where the build keeps its shared 96, so the band colour stops early while card-to-footer distance matches within 2px (1440) or 16px (390)";
const PRO_SOON = "; the proLimits row shows the Coming soon tag where the board shows Pro (owner ruling 2026-10-25: Pro is not on sale at launch)";
const HOME_1440 = ART + PRO_SOON + "; " + BANDS + "; above that, the hero art is 5px taller and later sections drift +6 to +14px; net page 51px shorter (5471 vs 5522)";
const HOME_390 = "art text and the product photo rasterise differently in Sketch and Chromium; sections drift down 5 to 27px in steps of at most 8 (hero +5, cheaper price row +4, grouped rows +2 each, unexplained residual text-metric drift); " + BANDS + "; net page +18px";
const SELLERS_390 = "board steps band is a fixed 600 with a fixed 150px step pitch, the build sizes steps by content (545, -55px); board CTA keeps 53px between title and card with no line, build 32 (-20); band bottom 84 vs 71 (-13); back link row is a 44px target vs 27 text (+17); footer gap 96 vs board 32 (+64)";
const SELLERS_1440 = "Chromium wraps the hero and feature copy a word differently from Sketch, Arabic most; page +48px en, +112px ar, not split per section (unexplained residual); footer gap 96 vs board 32";
export const TOLERANCE: Record<string, { max: number; reason: string }> = {
  "Checkout-summary-1440": { max: 0.05, reason: NOTE },
  "Checkout-summary-390": { max: 0.12, reason: NOTE },
  "Checkout-redirecting-390": { max: 0.04, reason: "Board spinner sits in a 44px box, ours is 32px with a margin; card text sits 1px inside and 8px lower on a 390 wide card." },
  "Checkout-failed-390": { max: 0.07, reason: NOBTN },
  "Checkout-success-390": { max: 0.07, reason: NOBTN },
  "Checkout-already-pro-390": { max: 0.07, reason: NOBTN },
  "Checkout-cancelled-390": { max: 0.07, reason: NOBTN },
  "ResetPassword-set-new-password-1440": { max: 0.03, reason: FIELD },
  "ResetPassword-weak-password-1440": { max: 0.03, reason: FIELD },
  "ResetPassword-saving-1440": { max: 0.03, reason: FIELD },
  "ResetPassword-error-1440": { max: 0.03, reason: FIELD },
  "ResetPassword-set-new-password-390": { max: 0.08, reason: FIELD },
  "ResetPassword-weak-password-390": { max: 0.08, reason: FIELD },
  "ResetPassword-saving-390": { max: 0.08, reason: FIELD },
  "ResetPassword-error-390": { max: 0.08, reason: FIELD },
  "Checkout-failed-1440": { max: 0.04, reason: NOBTN },
  "ResetPassword-verifying-390": { max: 0.04, reason: RASTER },
  "ResetPassword-success-390": { max: 0.04, reason: RASTER },
  "Checkout-signed-out-390": { max: 0.04, reason: RASTER },
  "Checkout-waiting-390": { max: 0.04, reason: RASTER },
  "Terms-default-1440": { max: 0.04, reason: TEXT },
  "Terms-default-390": { max: 0.09, reason: TEXT },
  "Privacy-default-1440": { max: 0.04, reason: TEXT + "; the build's privacy copy gained the Vercel/Tally paragraph after the board was drawn" },
  "Privacy-default-390": { max: 0.09, reason: TEXT + "; plus the paragraph added after the board was drawn" },
  "Pricing-no-prices-1440": { max: 0.04, reason: "Free 0, featured border and sellers row now drawn (GP-262 P2-1); remaining: sellers row text metrics; measured en 0.02, ar 0.03" },
  "Pricing-no-prices-390": { max: 0.08, reason: "Free 0, featured border and sellers row now drawn (GP-262 P2-1); footer margin is 96 where the 390 board leaves 48; measured en 0.04, ar 0.07" },
  "Welcome-default-390": { max: 0.05, reason: "step art now shipped (GP-262 P1-11), no change in ratio: footer margin is 96 where the 390 board leaves 48, and the sign-in lines sit 7px lower; measured en 0.05, ar 0.05" },
  "NotFound-default-390": { max: 0.05, reason: "Noto Sans Arabic line metrics differ between Sketch and Chromium" },
  "Home-launch-1440": { max: 0.07, reason: HOME_1440 + "; measured en 0.05, ar 0.06" },
  "Home-launch-390": { max: 0.09, reason: HOME_390 + PRO_SOON + "; measured en 0.08, ar 0.07" },
  "Sellers-launch-1440": { max: 0.07, reason: SELLERS_1440 + "; measured en 0.04, ar 0.06" },
  "Sellers-launch-390": { max: 0.11, reason: SELLERS_390 + "; measured en 0.10, ar 0.07" },
  "Sellers-prelaunch-1440": { max: 0.08, reason: SELLERS_1440 + "; the waitlist forms are native and unmasked (GP-389), drawn as the board's WebWaitlistForm with the seller note inside the form; measured en 0.03, ar 0.06" },
  "Sellers-prelaunch-390": { max: 0.13, reason: SELLERS_390 + "; the waitlist forms are native and unmasked (GP-389) and the page height now equals the board's (3819), the remaining diff is the step/CTA/footer deltas above; measured en 0.12, ar 0.05" },
  "Sellers-prelaunch-joined-1440": { max: 0.08, reason: SELLERS_1440 + "; hero form in the joined state after a stubbed 201; measured en 0.03, ar 0.06" },
  "Sellers-prelaunch-joined-390": { max: 0.12, reason: SELLERS_390 + "; hero form in the joined state after a stubbed 201; measured en 0.11, ar 0.05" },
};

/** Boards the build cannot match yet; reported, never loosened. Key: `<Screen>-<state>`. */
const PRELAUNCH = "prelaunch boards predate the GP-372 sections; owner ruled prelaunch shows them (baseline strip, feature art, grouped rows), so the page runs about 1100px past the board (measured 0.11 to 0.12)";
export const DIVERGED: Record<string, string> = {
  "Home-prelaunch": PRELAUNCH,
  "Home-cookie-notice": PRELAUNCH,
};
const key = (screen: string, state: string) => [screen, state].filter(Boolean).join("-");
export const isDiverged = (screen: string, state: string) => !process.env.PARITY_MEASURE && key(screen, state) in DIVERGED;
export const divergedReason = (screen: string, state: string) => DIVERGED[key(screen, state)];

/** One masked region: where it sits in the build, why it intentionally differs from the board. */
export type Mask = { locator: (page: Page) => Locator; reason: string };

export type Shot = {
  /** Board screen and state, e.g. `Home` + `prelaunch`. */
  screen: string;
  state: string;
  width: (typeof WIDTHS)[number];
  locale: "en" | "ar";
  theme?: "light" | "dark";
  /** Per-screen tolerance, only with a written reason. */
  maxDiffPixelRatio?: number;
  masks?: Mask[];
};

export const refName = (s: Pick<Shot, "screen" | "state" | "width" | "locale" | "theme">) =>
  `${[s.screen, s.state].filter(Boolean).join("-")}-${s.width}-${s.locale}-${s.theme ?? "light"}.png`;

/** PNG width and height live at fixed offsets in the IHDR chunk. */
function pngSize(file: string): { width: number; height: number } {
  const b = readFileSync(file);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

/** Board artboards have fixed heights, so the viewport takes the board's height and the capture sizes match. */
export async function sizeToBoard(page: Page, s: Shot) {
  const { width, height } = pngSize(join(REFS, refName(s)));
  await page.setViewportSize({ width, height });
  if (s.theme === "dark") await page.emulateMedia({ colorScheme: "dark" });
}

/** Cookie consent decided, so the notice does not overlay states that are not about it. The cookie is set for the project's baseURL (local server or PLAYWRIGHT_BASE_URL). */
export const decideConsent = (page: Page) =>
  page.context().addCookies([{ name: "gp_consent", value: "decline", url: String(test.info().project.use.baseURL) }]);

/** Compare the page with the board. Masked regions are painted in both images at the build's box. */
export async function expectParity(page: Page, s: Shot) {
  const name = refName(s);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur()); // no focus ring: boards are unfocused
  await page.evaluate(() => document.fonts.ready);
  const locators = (s.masks ?? []).map((m) => m.locator(page));
  const boxes = (await Promise.all(locators.flatMap(async (l) => (await l.count()) ? l.evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })) : [])))
    .flat();
  mkdirSync(BASELINES, { recursive: true });
  const target = join(BASELINES, name);
  if (boxes.length === 0) copyFileSync(join(REFS, name), target);
  else {
    const overlays = await Promise.all(boxes.map(async (b) => ({
      input: await sharp({ create: { width: Math.max(1, Math.round(b.w)), height: Math.max(1, Math.round(b.h)), channels: 3, background: MASK_RGB } }).png().toBuffer(),
      left: Math.round(b.x),
      top: Math.round(b.y),
    })));
    await sharp(join(REFS, name)).composite(overlays).png().toFile(target);
  }
  // Viewport capture: the viewport is the board's height, so sizes match; docHeight in the measure log reports any overflow.
  const max = s.maxDiffPixelRatio ?? TOLERANCE[`${[s.screen, s.state].filter(Boolean).join("-")}-${s.width}`]?.max;
  const options = { fullPage: false, mask: locators, maskColor: "#ff00ff", ...(max === undefined ? {} : { maxDiffPixelRatio: max }) };
  if (!process.env.PARITY_MEASURE) return expect(page).toHaveScreenshot(name, options);
  try {
    await expect(page).toHaveScreenshot(name, { ...options, maxDiffPixelRatio: 0 });
    await appendRatio(name, 0, page);
  } catch (e) {
    const m = /ratio (\d+\.\d+)/.exec(String(e));
    const size = /Expected an image (\d+)px by (\d+)px, received (\d+)px by (\d+)px/.exec(String(e));
    await appendRatio(name, m ? Number(m[1]) : size ? -1 : NaN, page, size?.[0]);
  }
}

async function appendRatio(name: string, ratio: number, page: Page, note?: string) {
  // Content height: where the footer ends (the document is never shorter than the viewport).
  const docHeight = await page.evaluate(() => Math.round(document.querySelector("footer")?.getBoundingClientRect().bottom ?? 0));
  mkdirSync("test-results", { recursive: true });
  appendFileSync("test-results/parity-ratios.jsonl", JSON.stringify({ name, ratio, note, docHeight, boardHeight: pngSize(join(REFS, name.replace("-form.png", ".png"))).height }) + "\n");
}

// ---------- route mocks (host-agnostic, so they also work against a deployed preview) ----------

export const json = (status: number, body: object) => ({ status, contentType: "application/json", body: JSON.stringify(body) });
const ok = (data: object) => json(200, { success: true, data, error: null, meta: {} });
const err = (status: number, code: string) => json(status, { success: false, data: null, error: { code, message: code }, meta: {} });
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: "u1", exp: 4102444800, aud: "authenticated", role: "authenticated" })}.sig`;
const user = { id: "u1", aud: "authenticated", email: "you@example.com", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" };
const hang = () => new Promise<never>(() => {});

export type WaitlistState = "empty" | "submitting" | "error" | "failed" | "joined";

/** The API's envelope for POST /api/v1/waitlist (201 joined, 200 already_joined, errors as { error: { code } }). */
export const waitlistReply = (status: 201 | 200 | 400 | 429 | 503, code = "UNAVAILABLE") =>
  status === 201 || status === 200
    ? json(status, { success: true, data: { status: status === 201 ? "joined" : "already_joined" }, meta: {} })
    : json(status, { success: false, error: { code, message: code }, meta: {} });

/**
 * Puts the hero waitlist form into a board state against a stubbed API: submitting hangs, failed answers 503, joined 201.
 * Values are the boards' (copy keys `<state>.input.email.value`).
 */
export async function seedWaitlist(page: Page, state: WaitlistState, values: { error: string; filled: string }, button: string) {
  await page.route("**/api/v1/waitlist", (route) =>
    state === "submitting" ? hang() : route.fulfill(waitlistReply(state === "joined" ? 201 : 503)));
  if (state === "empty") return;
  const form = page.locator("#waitlist form");
  await form.locator('input[name="email"]').fill(state === "error" ? values.error : values.filled);
  await form.getByRole("button", { name: button }).click();
  const settled = { submitting: '[data-waitlist="submitting"]', error: '[data-waitlist="error"]', failed: '[data-waitlist="failed"]', joined: '[data-waitlist="joined"]' }[state];
  await page.locator(`#waitlist ${settled}`).waitFor();
}

/**
 * Hero form rectangle on the Home prelaunch boards, measured in Web.sketch (frame of the hero/waitlist instance):
 * x and y by width and locale, height by state and locale. The rest of those boards predates GP-372 (see DIVERGED),
 * so the form is compared on its own: the board crop against the same-size box at the build's form.
 */
const FORM_AT: Record<string, { x: number; y: number; w: number }> = {
  "1440-en": { x: 120, y: 505, w: 400 }, "1440-ar": { x: 920, y: 557, w: 400 },
  "390-en": { x: 16, y: 343, w: 358 }, "390-ar": { x: 16, y: 371, w: 358 },
};
const FORM_H: Record<WaitlistState, { en: number; ar: number }> = {
  empty: { en: 158, ar: 161 }, submitting: { en: 158, ar: 164 }, error: { en: 154, ar: 157 }, failed: { en: 182, ar: 167 }, joined: { en: 118, ar: 126 },
};

/** Per-state form tolerances above the 0.02 default, each with the measured ratio and the reason. Key: `<state>-<width>`. */
// en measures 0.01 to 0.02 in every state at both widths; the budgets below are for Arabic.
const AR_TEXT = "Noto Sans Arabic rasterises differently in Sketch and Chromium: every Arabic line (label, button, note, message) diffs with no layout offset";
const AR_FILLED = "; the rtl Input/email-filled master is 75 tall where rtl Input/empty is 72, so the board drops the button 3px in this state only; the build keeps the empty state's 72 (one form, no jump on submit)";
export const FORM_TOLERANCE: Record<string, { max: number; reason: string }> = {
  "empty-1440": { max: 0.04, reason: AR_TEXT + "; measured en 0.01 (dark 0.01), ar 0.03 (dark 0.03)" },
  "empty-390": { max: 0.04, reason: AR_TEXT + "; measured en 0.02, ar 0.03" },
  "error-1440": { max: 0.05, reason: AR_TEXT + "; measured en 0.02, ar 0.04" },
  "error-390": { max: 0.05, reason: AR_TEXT + "; measured en 0.02, ar 0.04" },
  "joined-1440": { max: 0.05, reason: AR_TEXT + "; measured en 0.02, ar 0.04" },
  "joined-390": { max: 0.05, reason: AR_TEXT + "; measured en 0.02, ar 0.04" },
  "submitting-1440": { max: 0.08, reason: AR_TEXT + AR_FILLED + "; measured en 0.02, ar 0.07" },
  "submitting-390": { max: 0.08, reason: AR_TEXT + AR_FILLED + "; measured en 0.02, ar 0.07" },
  "failed-1440": { max: 0.08, reason: AR_TEXT + AR_FILLED + "; measured en 0.02, ar 0.07" },
  "failed-390": { max: 0.09, reason: AR_TEXT + AR_FILLED + "; measured en 0.02, ar 0.08" },
};

/** Compares the hero waitlist form alone with the same rectangle of the board export. */
export async function expectFormParity(page: Page, s: Shot & { state: WaitlistState }) {
  const at = FORM_AT[`${s.width}-${s.locale}`];
  const h = FORM_H[s.state][s.locale];
  const ref = refName({ ...s, state: s.state === "empty" ? "prelaunch" : `prelaunch-${s.state}` });
  const name = ref.replace(/\.png$/, "-form.png");
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.evaluate(() => document.fonts.ready);
  mkdirSync(BASELINES, { recursive: true });
  await sharp(join(REFS, ref)).extract({ left: at.x, top: at.y, width: at.w, height: h }).png().toFile(join(BASELINES, name));
  const box = await page.locator("#waitlist [data-waitlist]").boundingBox();
  if (!box) throw new Error("hero waitlist form not rendered");
  const clip = { x: Math.round(box.x), y: Math.round(box.y), width: at.w, height: h };
  const max = FORM_TOLERANCE[`${s.state}-${s.width}`]?.max;
  const options = { clip, ...(max === undefined ? {} : { maxDiffPixelRatio: max }) };
  if (!process.env.PARITY_MEASURE) return expect(page).toHaveScreenshot(name, options);
  try {
    await expect(page).toHaveScreenshot(name, { ...options, maxDiffPixelRatio: 0 });
    await appendRatio(name, 0, page, `form at ${clip.x},${clip.y}`);
  } catch (e) {
    const m = /ratio (\d+\.\d+)/.exec(String(e));
    await appendRatio(name, m ? Number(m[1]) : NaN, page, `form at ${clip.x},${clip.y}`);
  }
}

export type ResetState = "verifying" | "set-new-password" | "weak-password" | "saving" | "error" | "success" | "link-expired";

export async function seedReset(page: Page, state: ResetState, path: string, label: string, saveLabel: string) {
  await page.route(/supabase\.co/, (route) => route.abort());
  await page.route("**/auth/v1/**", async (route) => {
    const { pathname } = new URL(route.request().url());
    const put = route.request().method() === "PUT";
    if (pathname.endsWith("/verify")) {
      if (state === "verifying") return hang();
      if (state === "link-expired") return route.fulfill(json(403, { code: 403, error_code: "otp_expired", msg: "expired" }));
      return route.fulfill(json(200, { access_token: jwt, refresh_token: "r", expires_in: 3600, token_type: "bearer", user }));
    }
    if (pathname.endsWith("/user") && put) {
      if (state === "saving") return hang();
      return route.fulfill(state === "error" ? json(500, { code: 500, msg: "boom" }) : json(200, user));
    }
    return route.fulfill(pathname.endsWith("/user") ? json(200, user) : json(404, {}));
  });
  await page.goto(`${path}/reset-password?token_hash=h&type=recovery`);
  if (!["set-new-password", "weak-password", "saving", "error", "success"].includes(state)) return;
  const field = page.getByLabel(label);
  await field.waitFor();
  if (state === "set-new-password") return;
  await field.fill(state === "weak-password" ? "short" : "Abcdef12");
  await page.getByRole("button", { name: saveLabel }).click();
}

export type CheckoutState = "summary" | "signed-out" | "already-pro" | "failed" | "redirecting" | "cancelled" | "waiting" | "success";

export async function seedCheckout(page: Page, state: CheckoutState, path: string, continueLabel: string) {
  await page.route(/api\.example\.test/, (route) => route.abort());
  await page.route("**/api/v1/**", async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname.endsWith("/summary")) {
      if (state === "already-pro") return route.fulfill(err(409, "ALREADY_PRO"));
      if (state === "failed") return route.fulfill(err(500, "WHATEVER"));
      return route.fulfill(ok({ plan: "pro_monthly", priceMinor: 9900, currency: "EGP", period: "month" }));
    }
    if (pathname.endsWith("/redeem")) return route.fulfill(ok({ redirectUrl: "https://pay.example.test/session" }));
    return route.fulfill(ok({ status: state === "waiting" ? "pending" : "active" }));
  });
  // Cancel the hand-off navigation so the redirecting view stays on screen (a 204 or an abort leaves Playwright waiting on it).
  await page.addInitScript(() => {
    (window as unknown as { navigation: EventTarget }).navigation.addEventListener("navigate", (e) => {
      const ev = e as Event & { destination: { url: string } };
      if (ev.cancelable && new URL(ev.destination.url).hostname === "pay.example.test") ev.preventDefault();
    });
  });
  if (state === "cancelled" || state === "waiting" || state === "success") {
    const status = state === "cancelled" ? "cancelled" : "success";
    return void (await page.goto(`${path}/checkout/return#rt=t&status=${status}`));
  }
  await page.goto(state === "signed-out" ? `${path}/checkout` : `${path}/checkout#code=c`);
  // The summary view renders after hydration and its fetch; masks are measured right after, so wait for it (a slower hydration, e.g. with GTM on, otherwise races).
  if (state === "summary") await page.getByRole("button", { name: continueLabel }).waitFor();
  if (state === "redirecting") {
    await page.getByRole("button", { name: continueLabel }).click();
    await page.waitForFunction(() => document.querySelector("main a"));
    await page.waitForTimeout(300);
  }
}

export const spinnerMask: Mask = {
  locator: (p) => p.locator('[role="status"] > [aria-hidden="true"]'),
  reason: "spinner: animated, drawn by the board as a static ring at a different phase",
};
