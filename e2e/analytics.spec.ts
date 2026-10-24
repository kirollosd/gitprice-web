import { expect, test, type Page } from "./fixtures";
import en from "../i18n/en.json";

const GTM = "https://www.googletagmanager.com/**";
const HEAP = "**/cdn.us.heap-api.com/**";
const stub = { contentType: "text/javascript", body: "" };

// Consent pushes are `arguments` objects (gtag style); normalise every entry to a plain array or object.
const layer = (page: Page) =>
  page.evaluate(() => ((window as unknown as { dataLayer?: unknown[] }).dataLayer ?? []).map((e) =>
    Object.prototype.toString.call(e) === "[object Arguments]" ? Array.from(e as ArrayLike<unknown>) : e));
const hasEvent = (page: Page, name: string) => async () => (await layer(page)).some((e) => (e as { event?: string }).event === name);

let heapRequests: string[];
let gtmRequests: string[];

test.beforeEach(async ({ page }) => {
  heapRequests = [];
  gtmRequests = [];
  await page.route(GTM, (r) => { gtmRequests.push(r.request().url()); return r.fulfill(stub); });
  await page.route(HEAP, (r) => { heapRequests.push(r.request().url()); return r.fulfill(stub); });
});

test("GTM loads with consent default denied, no _ga cookies, no Heap", async ({ page, context }) => {
  await page.goto("/");
  await expect.poll(() => gtmRequests.some((u) => u.includes("gtm.js?id=GTM-TEST000"))).toBe(true);
  const dl = await layer(page);
  const def = dl.find((e) => Array.isArray(e) && e[0] === "consent" && e[1] === "default") as unknown[];
  expect(def[2]).toMatchObject({ analytics_storage: "denied" });
  expect((await context.cookies()).filter((c) => c.name.startsWith("_ga"))).toEqual([]);
  expect(heapRequests).toEqual([]);
});

test("Allow pushes the granted update and loads Heap", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("region", { name: en.web.component.webCookieNotice.default.title })
    .getByRole("button", { name: en.web.component.webCookieNotice.default.button.allow.label }).click();
  await expect.poll(async () => (await layer(page)).some((e) =>
    Array.isArray(e) && e[0] === "consent" && e[1] === "update" && (e[2] as { analytics_storage?: string }).analytics_storage === "granted")).toBe(true);
  await expect.poll(() => heapRequests.length).toBeGreaterThan(0);
});

test("scrolling to features pushes section_view", async ({ page }) => {
  await page.goto("/");
  await page.locator("#features").scrollIntoViewIfNeeded();
  await expect.poll(async () => (await layer(page)).some((e) =>
    (e as { event?: string; section_id?: string }).event === "section_view" && (e as { section_id?: string }).section_id === "features")).toBe(true);
});

test("nav For sellers click pushes cta_click", async ({ page }) => {
  await page.goto("/");
  await page.locator('header [data-gp-cta-id="for_sellers"]:visible').first().click();
  await expect.poll(async () => (await layer(page)).some((e) =>
    (e as { event?: string; cta_id?: string }).event === "cta_click" && (e as { cta_id?: string }).cta_id === "for_sellers")).toBe(true);
});

test("events carry locale ar under /ar", async ({ page }) => {
  await page.goto("/ar");
  await page.locator("#features").scrollIntoViewIfNeeded();
  await expect.poll(hasEvent(page, "section_view")).toBe(true);
  const events = (await layer(page)).filter((e) => !Array.isArray(e) && !String((e as { event?: string }).event ?? "").startsWith("gtm.")) as { locale?: string }[];
  expect(events.length).toBeGreaterThan(0);
  expect(events.every((e) => e.locale === "ar")).toBe(true);
});

test("with GTM blocked the page renders, Allow works, no page errors", async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (e) => errors.push(e));
  await page.unroute(GTM);
  await page.route(GTM, (r) => r.abort());
  await page.goto("/");
  const notice = page.getByRole("region", { name: en.web.component.webCookieNotice.default.title });
  await expect(page.locator("main")).toBeVisible();
  await notice.getByRole("button", { name: en.web.component.webCookieNotice.default.button.allow.label }).click();
  await expect(notice).toBeHidden();
  expect(errors).toEqual([]);
});

