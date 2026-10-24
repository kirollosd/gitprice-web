import { expect, test, type Page } from "./fixtures";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

// The build points at a fake Supabase host; every auth call is stubbed, nothing leaves the machine.
const SUPABASE = "https://example.supabase.co"; // matches playwright.config.ts
const R = en.web.resetPassword;
const GOOD = "Abcdef12";
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: "u1", exp: 4102444800, aud: "authenticated", role: "authenticated" })}.sig`;
const user = { id: "u1", aud: "authenticated", email: "a@b.co", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" };
const session = { access_token: jwt, refresh_token: "r", expires_in: 3600, token_type: "bearer", user };
const json = (status: number, body: object) => ({ status, contentType: "application/json", body: JSON.stringify(body) });

// Address-bar search+hash at each Supabase call. Asserted after the flow: a throw inside a route handler would not fail the test.
let seenUrls: string[] = [];
let expectsNetwork = true;
test.beforeEach(() => { seenUrls = []; expectsNetwork = true; });
test.afterEach(() => {
  if (expectsNetwork) expect(seenUrls.length).toBeGreaterThan(0);
  expect(seenUrls.filter((u) => u !== "")).toEqual([]);
});

type Stub = { verify?: ReturnType<typeof json>; update?: ReturnType<typeof json>[] };
async function stub(page: Page, s: Stub) {
  const calls = { verify: 0, update: 0 };
  // Safety net: registered first, so the specific stubs below win and anything else is aborted.
  await page.route(/supabase\.co/, (route) => route.abort());
  const updates = [...(s.update ?? [json(200, user)])];
  await page.route(`${SUPABASE}/auth/v1/**`, (route) => {
    const { pathname } = new URL(route.request().url());
    // Tokens must be gone from the address bar before the first network call.
    const here = new URL(page.url());
    seenUrls.push(here.search + here.hash);
    if (pathname.endsWith("/verify")) { calls.verify++; return route.fulfill(s.verify ?? json(200, session)); }
    if (pathname.endsWith("/logout")) return route.fulfill({ status: 204 });
    if (pathname.endsWith("/user") && route.request().method() === "PUT") { calls.update++; return route.fulfill(updates.shift() ?? json(200, user)); }
    if (pathname.endsWith("/user")) return route.fulfill(json(200, user));
    return route.fulfill(json(404, {}));
  });
  return calls;
}
const expired = json(403, { code: 403, error_code: "otp_expired", msg: "Email link is invalid or has expired" });
const save = (page: Page) => page.getByRole("button", { name: R.button.label });

test("otp link: verify, set password, success; hash and token_hash are stripped", async ({ page }) => {
  const calls = await stub(page, {});
  await page.goto("/reset-password?token_hash=h&type=recovery");
  await expect(page.getByLabel(R.field.label)).toBeVisible();
  expect(await page.evaluate(() => location.hash + location.search)).toBe("");
  await page.getByLabel(R.field.label).fill(GOOD);
  await save(page).click();
  await expect(page.getByRole("heading", { name: R.success.title })).toBeVisible();
  expect(calls).toEqual({ verify: 1, update: 1 });
});

test("implicit link: the fragment is stripped and the password saves", async ({ page }) => {
  await stub(page, {});
  await page.goto(`/reset-password#access_token=${jwt}&refresh_token=r&type=recovery`);
  await expect(page.getByLabel(R.field.label)).toBeVisible();
  expect(await page.evaluate(() => location.hash)).toBe("");
  await page.getByLabel(R.field.label).fill(GOOD);
  await save(page).click();
  await expect(page.getByRole("heading", { name: R.success.title })).toBeVisible();
});

test("expired otp shows link-expired", async ({ page }) => {
  await stub(page, { verify: expired });
  await page.goto("/reset-password?token_hash=h&type=recovery");
  await expect(page.getByRole("heading", { name: R.linkExpired.title })).toBeVisible();
  expect(await page.evaluate(() => location.search)).toBe("");
});

test("a non-expiry verify failure also lands on link-expired, not a form without a session", async ({ page }) => {
  await stub(page, { verify: json(500, { code: 500, msg: "boom" }) });
  await page.goto("/reset-password?token_hash=h&type=recovery");
  await expect(page.getByRole("heading", { name: R.linkExpired.title })).toBeVisible();
  await expect(page.getByLabel(R.field.label)).toHaveCount(0);
});

test("a server_error link lands on link-expired", async ({ page }) => {
  expectsNetwork = false; // dead on arrival: no Supabase call is made
  await stub(page, {});
  await page.goto("/reset-password#error=server_error&error_description=x");
  await expect(page.getByRole("heading", { name: R.linkExpired.title })).toBeVisible();
});

test("error in the fragment and an empty URL show link-expired", async ({ page }) => {
  expectsNetwork = false;
  await stub(page, {});
  await page.goto("/reset-password#error=access_denied&error_code=otp_expired");
  await expect(page.getByRole("heading", { name: R.linkExpired.title })).toBeVisible();
  await page.goto("/reset-password");
  await expect(page.getByRole("heading", { name: R.linkExpired.title })).toBeVisible();
});

test("a weak password is announced and never sent", async ({ page }) => {
  const calls = await stub(page, {});
  await page.goto("/reset-password?token_hash=h");
  const input = page.getByLabel(R.field.label);
  await input.fill("short");
  await save(page).click();
  const hint = page.getByRole("status").filter({ hasText: R.weak.message });
  await expect(hint).toBeVisible();
  await expect(input).toHaveAttribute("aria-describedby", await hint.getAttribute("id") ?? "");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  expect(calls.update).toBe(0);
});

test("a server weak_password answer shows the weak message", async ({ page }) => {
  await stub(page, { update: [json(422, { code: 422, error_code: "weak_password", msg: "weak" })] });
  await page.goto("/reset-password?token_hash=h");
  await page.getByLabel(R.field.label).fill(GOOD);
  await save(page).click();
  await expect(page.getByText(R.weak.message)).toBeVisible();
});

test("update 500 shows the error, retry works and does not re-verify the otp", async ({ page }) => {
  const calls = await stub(page, { update: [json(500, { code: 500, msg: "boom" }), json(200, user)] });
  await page.goto("/reset-password?token_hash=h");
  await page.getByLabel(R.field.label).fill(GOOD);
  await save(page).click();
  await expect(page.getByText(R.error.field.message)).toBeVisible();
  await expect(save(page)).toBeEnabled();
  await save(page).click();
  await expect(page.getByRole("heading", { name: R.success.title })).toBeVisible();
  expect(calls).toEqual({ verify: 1, update: 2 });
});

test("update 401 shows link-expired", async ({ page }) => {
  await stub(page, { update: [json(401, { code: 401, msg: "jwt expired" })] });
  await page.goto("/reset-password?token_hash=h");
  await page.getByLabel(R.field.label).fill(GOOD);
  await save(page).click();
  await expect(page.getByRole("heading", { name: R.linkExpired.title })).toBeVisible();
});

test("the submit button is disabled while saving", async ({ page }) => {
  await stub(page, {});
  await page.route(`${SUPABASE}/auth/v1/user`, async (route) => {
    if (route.request().method() !== "PUT") return route.fallback();
    await new Promise((r) => setTimeout(r, 400));
    await route.fulfill(json(200, user));
  });
  await page.goto("/reset-password?token_hash=h");
  await page.getByLabel(R.field.label).fill(GOOD);
  await save(page).click();
  await expect(page.getByRole("button", { name: R.saving.button.label })).toBeDisabled();
  await expect(page.getByRole("heading", { name: R.success.title })).toBeVisible();
});

for (const [path, locale] of [["/reset-password", "en"], ["/ar/reset-password", "ar"]] as const) {
  test(`hosted shell on ${path}: logo + language switch nav, site footer without sellers, noindex, no hydration errors`, async ({ page }) => {
    const problems: string[] = [];
    page.on("pageerror", (e) => problems.push(e.message));
    // /_vercel/insights 404s off Vercel; every other console error, including failed CSS/JS/fonts, fails the test.
    page.on("console", (m) => m.type() === "error" && !m.location().url.includes("/_vercel/insights") && problems.push(m.text()));
    await stub(page, {});
    const res = await page.goto(`${path}?token_hash=h`);
    expect(res?.headers()["referrer-policy"]).toBe("no-referrer");
    const copy = (locale === "ar" ? ar : en).web.resetPassword.field.label;
    await expect(page.getByLabel(copy)).toBeFocused();
    await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    await expect(page.locator("header nav")).toHaveCount(0);
    await expect(page.locator('a[href*="sellers"]')).toHaveCount(0);
    await expect(page.locator("header a[hreflang]")).toHaveCount(1);
    await expect(page.locator("footer a[hreflang]")).toHaveCount(1);
    await expect(page.locator('footer a[href$="/privacy"]')).toHaveCount(1);
    await expect(page.locator('footer a[href$="/terms"]')).toHaveCount(1);
    await expect(page.locator("footer [data-cookie-settings]")).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    expect(problems).toEqual([]);
  });
}

test.describe("390 wide", () => {
  test.use({ viewport: { width: 390, height: 800 } });
  for (const base of ["", "/ar"]) {
    for (const [name, url] of [["form", "?token_hash=h"], ["expired", ""]] as const) {
      test(`no horizontal overflow on ${base}/reset-password (${name})`, async ({ page }) => {
        expectsNetwork = name === "form"; // the expired case has no token, so no call
        await stub(page, {});
        await page.goto(`${base}/reset-password${url}`);
        await page.waitForSelector("h1");
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
      });
    }
  }
});
