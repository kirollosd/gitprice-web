import { expect, test, type Page } from "@playwright/test";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

// The build points at a fake API host; every call is stubbed, nothing leaves the machine.
const API = "https://api.example.test/api/v1"; // matches playwright.config.ts
const PAY = "https://pay.example.test";
const json = (status: number, body: object) => ({ status, contentType: "application/json", body: JSON.stringify(body) });
const ok = (data: object) => json(200, { success: true, data, error: null, meta: {} });
const err = (status: number, code: string) => json(status, { success: false, data: null, error: { code, message: code }, meta: {} });
const SUMMARY = { plan: "pro_monthly", priceMinor: 9900, currency: "EGP", period: "month" };
const YEARLY = { plan: "pro_annual", priceMinor: 99900, currency: "EGP", period: "year" };

const COPY = { en: en.web.checkout, ar: ar.web.checkout };
const LOCALES = [["", "en"], ["/ar", "ar"]] as const;

// Address-bar hash at each API call. Asserted after the flow: a throw inside a route handler would not fail the test.
let seenUrls: string[] = [];
let expectsNetwork = true;
test.beforeEach(() => { seenUrls = []; expectsNetwork = true; });
test.afterEach(() => {
  if (expectsNetwork) expect(seenUrls.length).toBeGreaterThan(0);
  expect(seenUrls.filter((u) => u !== "")).toEqual([]);
});

type Reply = ReturnType<typeof json>;
type Stub = { summary?: Reply; redeem?: Reply | (() => Promise<Reply>); returns?: Reply[] };
async function stub(page: Page, s: Stub) {
  const calls = { summary: [] as string[], redeem: [] as { path: string; body: string | null }[], returns: [] as string[] };
  // Safety net: registered first, so the specific stubs below win and anything else is aborted.
  await page.route(/api\.example\.test/, (route) => route.abort());
  await page.route(`${API}/**`, async (route) => {
    const { pathname } = new URL(route.request().url());
    const here = new URL(page.url());
    seenUrls.push(here.search + here.hash);
    if (pathname.endsWith("/summary")) { calls.summary.push(pathname); return route.fulfill(s.summary ?? ok(SUMMARY)); }
    if (pathname.endsWith("/redeem")) {
      calls.redeem.push({ path: pathname, body: route.request().postData() });
      const r = s.redeem ?? ok({ redirectUrl: `${PAY}/session` });
      return route.fulfill(typeof r === "function" ? await r() : r);
    }
    calls.returns.push(pathname);
    const queue = s.returns ?? [ok({ status: "active" })];
    return route.fulfill(queue[Math.min(calls.returns.length - 1, queue.length - 1)]);
  });
  await page.route(`${PAY}/**`, (route) => route.fulfill({ contentType: "text/html", body: "<title>pay</title>paid" }));
  return calls;
}

const h1 = (page: Page, title: string) => page.getByRole("heading", { name: title });
const noActions = async (page: Page) => {
  await expect(page.locator("main button, main a")).toHaveCount(0);
};
const spinner = (page: Page) => page.locator('[role="status"] > [aria-hidden="true"]');

for (const [base, loc] of LOCALES) {
  const C = COPY[loc];
  // Hardcoded expectations (not formatPrice): digits and the decimal mark match in either Latin or Arabic-Indic form.
  const intl = (minor: number) => {
    const n = minor === 9900 ? "99.00" : "999.00";
    const digits = n.replace(/\d/g, (d) => `[${d}${String.fromCharCode(0x660 + Number(d))}]`).replace(".", "[.٫]");
    return loc === "ar" ? digits : `EGP ${n}`;
  };

  const totalText = (page: Page, tpl: string, minor: number) =>
    loc === "ar" ? page.getByText(new RegExp(intl(minor))) : page.getByText(tpl.replace("{price}", intl(minor)), { exact: true });

  test.describe(`handoff ${loc}`, () => {
    test("summary: plan and formatted total, fragment stripped before the call", async ({ page }) => {
      const calls = await stub(page, {});
      await page.goto(`${base}/checkout#code=ab/c`);
      await expect(h1(page, C.summary.title)).toBeVisible();
      await expect(page.getByText(C.summary.plan.month, { exact: true })).toBeVisible();
      await expect(totalText(page, C.summary.total.month, 9900)).toBeVisible();
      await expect(page.getByRole("button", { name: C.summary.button.label })).toBeEnabled();
      expect(await page.evaluate(() => location.hash + location.search)).toBe("");
      expect(calls.summary).toEqual(["/api/v1/subscription/checkout/handoff/ab%2Fc/summary"]);
      // Placeholder copy never renders.
      await expect(page.getByText(C.summary.note)).toHaveCount(0);
    });

    test("summary: yearly plan", async ({ page }) => {
      await stub(page, { summary: ok(YEARLY) });
      await page.goto(`${base}/checkout#code=c`);
      await expect(page.getByText(C.summary.plan.year, { exact: true })).toBeVisible();
      await expect(totalText(page, C.summary.total.year, 99900)).toBeVisible();
    });

    test("no code shows signed-out and makes no call", async ({ page }) => {
      expectsNetwork = false;
      const calls = await stub(page, {});
      await page.goto(`${base}/checkout`);
      await expect(h1(page, C.signedOut.title)).toBeVisible();
      await noActions(page);
      expect(calls.summary).toEqual([]);
    });

    for (const [name, reply, title] of [
      ["404", err(404, "HANDOFF_NOT_FOUND"), C.signedOut.title],
      ["410", err(410, "HANDOFF_EXPIRED"), C.signedOut.title],
      ["409 ALREADY_PRO", err(409, "ALREADY_PRO"), C.alreadyPro.title],
      ["503 PRICE_NOT_CONFIGURED", err(503, "PRICE_NOT_CONFIGURED"), C.failed.title],
      ["500 unknown code", err(500, "WHATEVER"), C.failed.title],
    ] as const) {
      test(`summary ${name}`, async ({ page }) => {
        await stub(page, { summary: reply });
        await page.goto(`${base}/checkout#code=c`);
        await expect(h1(page, title)).toBeVisible();
        await noActions(page);
      });
    }

    test("summary network error shows failed", async ({ page }) => {
      await stub(page, {});
      await page.route(`${API}/**`, (route) => { seenUrls.push(""); return route.abort(); });
      await page.goto(`${base}/checkout#code=c`);
      await expect(h1(page, C.failed.title)).toBeVisible();
    });

    test("continue posts the locale, then redirects", async ({ page }) => {
      const calls = await stub(page, {});
      await page.goto(`${base}/checkout#code=c`);
      await page.getByRole("button", { name: C.summary.button.label }).click();
      await page.waitForURL(`${PAY}/session`);
      expect(calls.redeem).toEqual([{ path: "/api/v1/subscription/checkout/handoff/c/redeem", body: JSON.stringify({ locale: loc }) }]);
    });

    test("continue is disabled while redeeming, so a second click sends nothing", async ({ page }) => {
      const calls = await stub(page, { redeem: async () => { await new Promise((r) => setTimeout(r, 800)); return err(502, "GATEWAY_ERROR"); } });
      await page.goto(`${base}/checkout#code=c`);
      const go = page.getByRole("button", { name: C.summary.button.label });
      await go.click();
      await expect(go).toBeDisabled();
      await go.click({ force: true });
      await expect(h1(page, C.failed.title)).toBeVisible();
      expect(calls.redeem).toHaveLength(1);
    });

    test("redirecting state offers a link fallback", async ({ page }) => {
      const calls = await stub(page, { redeem: async () => { await new Promise((r) => setTimeout(r, 300)); return ok({ redirectUrl: `${PAY}/session` }); } });
      // A 204 navigation response leaves the page in place, so the redirecting state stays on screen.
      await page.route(`${PAY}/**`, (route) => route.fulfill({ status: 204 }));
      await page.goto(`${base}/checkout#code=c`);
      await page.getByRole("button", { name: C.summary.button.label }).click();
      // Locators wait for a pending navigation, so read the DOM directly.
      const dom = (sel: string) => page.evaluate((q) => { const e = document.querySelector(q); return e && (e.getAttribute("href") ?? e.textContent); }, sel);
      await expect.poll(() => dom("h1")).toBe(C.redirecting.title);
      expect(await dom("main a")).toBe(`${PAY}/session`);
      expect(await page.evaluate(() => document.querySelector("main")?.textContent)).toContain(C.redirecting.fallback);
      expect(calls.redeem).toHaveLength(1);
    });

    for (const [name, reply, title] of [
      ["502 GATEWAY_ERROR", err(502, "GATEWAY_ERROR"), C.failed.title],
      ["503 SITE_URL_NOT_CONFIGURED", err(503, "SITE_URL_NOT_CONFIGURED"), C.failed.title],
      ["409 ALREADY_PRO", err(409, "ALREADY_PRO"), C.alreadyPro.title],
      ["410", err(410, "HANDOFF_USED"), C.signedOut.title],
      ["404", err(404, "HANDOFF_NOT_FOUND"), C.signedOut.title],
    ] as const) {
      test(`redeem ${name}`, async ({ page }) => {
        await stub(page, { redeem: reply });
        await page.goto(`${base}/checkout#code=c`);
        await page.getByRole("button", { name: C.summary.button.label }).click();
        await expect(h1(page, title)).toBeVisible();
        await noActions(page);
      });
    }

    test("a javascript: redirectUrl is refused", async ({ page }) => {
      await stub(page, { redeem: ok({ redirectUrl: "javascript:alert(1)" }) });
      await page.goto(`${base}/checkout#code=c`);
      await page.getByRole("button", { name: C.summary.button.label }).click();
      await expect(h1(page, C.failed.title)).toBeVisible();
    });
  });

  test.describe(`return ${loc}`, () => {
    test("active gives success; the fragment is stripped before the call", async ({ page }) => {
      const calls = await stub(page, { returns: [ok({ status: "active" })] });
      await page.goto(`${base}/checkout/return#rt=t/1&status=success`);
      await expect(h1(page, C.success.title)).toBeVisible();
      expect(await page.evaluate(() => location.hash)).toBe("");
      expect(calls.returns).toEqual(["/api/v1/subscription/checkout/return/t%2F1"]);
      await noActions(page);
    });

    test("failed gives failed", async ({ page }) => {
      await stub(page, { returns: [ok({ status: "failed" })] });
      await page.goto(`${base}/checkout/return#rt=t&status=success`);
      await expect(h1(page, C.failed.title)).toBeVisible();
      await noActions(page);
    });

    test("cancelled shows cancelled without a call", async ({ page }) => {
      expectsNetwork = false;
      const calls = await stub(page, {});
      await page.goto(`${base}/checkout/return#rt=t&status=cancelled`);
      await expect(h1(page, C.cancelled.title)).toBeVisible();
      await noActions(page);
      expect(calls.returns).toEqual([]);
      expect(await page.evaluate(() => location.hash)).toBe("");
    });

    test("pending shows waiting with a spinner, then success on a later poll", async ({ page }) => {
      await page.clock.install();
      const calls = await stub(page, { returns: [ok({ status: "pending" }), ok({ status: "pending" }), ok({ status: "active" })] });
      await page.goto(`${base}/checkout/return#rt=t&status=success`);
      await expect(h1(page, C.waiting.title)).toBeVisible();
      await expect(spinner(page)).toHaveCount(1);
      await expect(async () => {
        await page.clock.runFor(2000);
        await expect(h1(page, C.success.title)).toBeVisible({ timeout: 300 });
      }).toPass();
      expect(calls.returns).toHaveLength(3);
    });

    test("polls every 2 s: one call before 2000 ms, a second after", async ({ page }) => {
      // Frozen clock: otherwise real time flows and the 2 s timer can fire early.
      await page.clock.install({ time: 0 });
      await page.clock.pauseAt(1000);
      const calls = await stub(page, { returns: [ok({ status: "pending" })] });
      await page.goto(`${base}/checkout/return#rt=t&status=success`);
      await expect.poll(() => calls.returns.length).toBe(1);
      await page.clock.runFor(1999);
      await page.waitForTimeout(150);
      expect(calls.returns).toHaveLength(1);
      await page.clock.runFor(2);
      await expect.poll(() => calls.returns.length).toBe(2);
    });

    test("navigating away stops polling", async ({ page }) => {
      await page.clock.install();
      const calls = await stub(page, { returns: [ok({ status: "pending" })] });
      await page.goto(`${base}/checkout/return#rt=t&status=success`);
      await expect.poll(() => calls.returns.length).toBe(1);
      await page.goto("about:blank");
      await page.waitForTimeout(150);
      expect(calls.returns).toHaveLength(1);
    });

    test("a hung poll request times out and polling continues", async ({ page }) => {
      await page.clock.install();
      const calls = await stub(page, { returns: [ok({ status: "active" })] });
      let first = true;
      // Registered after stub(): the first return request never answers.
      await page.route(`${API}/subscription/checkout/return/**`, (route) => {
        if (first) { first = false; seenUrls.push(""); return; }
        return route.fallback();
      });
      await page.goto(`${base}/checkout/return#rt=t&status=success`);
      await expect(async () => {
        await page.clock.runFor(2000);
        await expect(h1(page, C.success.title)).toBeVisible({ timeout: 500 });
      }).toPass({ timeout: 20_000 });
      expect(calls.returns.length).toBeGreaterThanOrEqual(1);
    });

    test("5xx and network errors keep polling", async ({ page }) => {
      await page.clock.install();
      await stub(page, { returns: [err(500, "INTERNAL_ERROR"), err(503, "X"), ok({ status: "active" })] });
      await page.goto(`${base}/checkout/return#rt=t&status=success`);
      await expect(async () => {
        await page.clock.runFor(2000);
        await expect(h1(page, C.success.title)).toBeVisible({ timeout: 300 });
      }).toPass();
    });

    test("a 60 s timeout shows the waiting copy without the spinner", async ({ page }) => {
      await page.clock.install();
      const calls = await stub(page, { returns: [ok({ status: "pending" })] });
      await page.goto(`${base}/checkout/return#rt=t&status=success`);
      await expect(spinner(page)).toHaveCount(1);
      // Each tick is 2 s of fake time; the real pause lets the stubbed fetch resolve and schedule the next poll.
      for (let i = 0; i < 40 && (await spinner(page).count()) > 0; i++) {
        await page.clock.runFor(2000);
        await page.waitForTimeout(30);
      }
      await expect(spinner(page)).toHaveCount(0);
      await expect(h1(page, C.waiting.title)).toBeVisible();
      await expect(page.getByText(C.waiting.body)).toBeVisible();
      const n = calls.returns.length;
      expect(n).toBeGreaterThanOrEqual(30);
      await page.clock.runFor(10_000);
      expect(calls.returns).toHaveLength(n); // polling stopped at the cap
    });

    for (const code of ["TOKEN_NOT_FOUND", "TOKEN_EXPIRED"]) {
      test(`${code} after a reload shows neutral copy, not failed`, async ({ page }) => {
        await stub(page, { returns: [err(404, code)] });
        await page.goto(`${base}/checkout/return#rt=t&status=success`);
        await expect(h1(page, C.waiting.title)).toBeVisible();
        await expect(spinner(page)).toHaveCount(0);
        await expect(h1(page, C.failed.title)).toHaveCount(0);
      });
    }

    test("no token shows the neutral waiting copy without a call", async ({ page }) => {
      expectsNetwork = false;
      const calls = await stub(page, {});
      await page.goto(`${base}/checkout/return`);
      await expect(h1(page, C.waiting.title)).toBeVisible();
      await expect(spinner(page)).toHaveCount(0);
      expect(calls.returns).toEqual([]);
    });
  });

  for (const path of ["/checkout", "/checkout/return"]) {
    test(`hosted shell on ${base}${path}: no-referrer, noindex, no nav, no errors`, async ({ page }) => {
      expectsNetwork = false;
      const problems: string[] = [];
      page.on("pageerror", (e) => problems.push(e.message));
      // /_vercel/insights 404s off Vercel; every other console error fails the test.
      page.on("console", (m) => m.type() === "error" && !m.location().url.includes("/_vercel/insights") && problems.push(m.text()));
      await stub(page, {});
      const res = await page.goto(`${base}${path}`);
      expect(res?.headers()["referrer-policy"]).toBe("no-referrer");
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("dir", loc === "ar" ? "rtl" : "ltr");
      await expect(page.locator('meta[name="referrer"]')).toHaveAttribute("content", "no-referrer");
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
      await expect(page.locator("header nav")).toHaveCount(0);
      await expect(page.locator('footer a[href$="/privacy"]')).toHaveCount(1);
      await expect(page.locator("footer [data-cookie-settings]")).toHaveCount(1);
      expect(problems).toEqual([]);
    });
  }
}

test.describe("390 wide", () => {
  test.use({ viewport: { width: 390, height: 800 } });
  for (const [base, loc] of LOCALES) {
    test(`no horizontal overflow on ${base}/checkout summary`, async ({ page }) => {
      await stub(page, {});
      await page.goto(`${base}/checkout#code=c`);
      await expect(h1(page, COPY[loc].summary.title)).toBeVisible();
      await expect(page.getByRole("button", { name: COPY[loc].summary.button.label })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    });
  }
});
