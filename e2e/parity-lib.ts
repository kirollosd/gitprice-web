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
const NOTE_PRE = "; prelaunch adds the hero waitlist note (one caption line) that the board omits, kept by owner ruling as the email field's data-use disclosure";
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
  "Sellers-prelaunch-1440": { max: 0.08, reason: SELLERS_1440 + NOTE_PRE + "; measured en 0.04, ar 0.07" },
  "Sellers-prelaunch-390": { max: 0.12, reason: SELLERS_390 + NOTE_PRE + "; the two waitlist frames start at 120 (skeleton, Tally's dynamicHeight sets the rest) instead of the old 160 floor (GP-262 P1-12), moving everything below up 80; measured en 0.11 (0.09 at 160), ar 0.08" },
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
  appendFileSync("test-results/parity-ratios.jsonl", JSON.stringify({ name, ratio, note, docHeight, boardHeight: pngSize(join(REFS, name)).height }) + "\n");
}

// ---------- route mocks (host-agnostic, so they also work against a deployed preview) ----------

export const json = (status: number, body: object) => ({ status, contentType: "application/json", body: JSON.stringify(body) });
const ok = (data: object) => json(200, { success: true, data, error: null, meta: {} });
const err = (status: number, code: string) => json(status, { success: false, data: null, error: { code, message: code }, meta: {} });
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: "u1", exp: 4102444800, aud: "authenticated", role: "authenticated" })}.sig`;
const user = { id: "u1", aud: "authenticated", email: "you@example.com", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" };
const hang = () => new Promise<never>(() => {});

/** Tally's script is a stub that loads nothing: the waitlist iframe stays a blank frame (no fallback link), masked where it matters. */
export const stubTally = (page: Page) =>
  page.route("https://tally.so/**", (route) =>
    route.request().url().endsWith("/widgets/embed.js")
      ? route.fulfill({ contentType: "text/javascript", body: "window.Tally={loadEmbeds(){}};" })
      : route.abort());

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
export const tallyMask: Mask = {
  locator: (p) => p.locator("iframe[data-tally-src]"),
  reason: "Tally embed: third-party iframe, not loaded in tests; the board draws a stand-in form",
};
