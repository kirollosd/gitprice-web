import { expect, test } from "@playwright/test";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

const banner = en.web.component.webLocaleSuggest.default.label;

test("root is English LTR", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
});

test("/ar is Arabic RTL", async ({ page }) => {
  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("/en/privacy 308s to /privacy and keeps query", async ({ request }) => {
  const res = await request.get("/en/privacy?a=1", { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers()["location"]).toBe("/privacy?a=1");
});

test("/en is 308 to /", async ({ request }) => {
  const res = await request.get("/en", { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers()["location"]).toBe("/");
});

test("unknown locale-less path renders 404 not a crash", async ({ request }) => {
  expect((await request.get("/nope")).status()).toBe(404);
});

const AR = "ar-EG,ar;q=0.9,en;q=0.8";

test.describe("Arabic Accept-Language", () => {
  test.use({ locale: "ar-EG" });

  test("/ is 200 with suggestion header and banner, no redirect", async ({ page, request }) => {
    const res = await request.get("/", { maxRedirects: 0, headers: { "Accept-Language": AR } });
    expect(res.status()).toBe(200);
    expect(res.headers()["x-gp-suggest"]).toBe("ar");
    await page.goto("/privacy");
    await expect(page).toHaveURL(/\/privacy$/);
    const link = page.getByRole("region", { name: banner }).getByRole("link", { name: "العربية" });
    await expect(link).toHaveAttribute("href", "/ar/privacy");
    await page.getByRole("button", { name: "Dismiss" }).click();
    await expect(link).toBeHidden();
    await page.reload();
    await expect(link).toBeHidden();
  });

  test("dismissed cookie suppresses the header; control still gets it", async ({ request }) => {
    const headers = { "Accept-Language": AR };
    const control = await request.get("/", { headers });
    expect(control.headers()["x-gp-suggest"]).toBe("ar");
    const dismissed = await request.get("/", { headers: { ...headers, cookie: "gp_suggest_dismissed=1" } });
    expect(dismissed.headers()["x-gp-suggest"]).toBeUndefined();
  });

  test("banner is gone after following the switch link", async ({ page }) => {
    await page.goto("/privacy");
    await page.getByRole("region", { name: banner }).getByRole("link", { name: "العربية" }).click();
    await expect(page).toHaveURL(/\/ar\/privacy$/);
    await expect(page.getByRole("region", { name: banner }).getByRole("link", { name: "العربية" })).toBeHidden();
  });
});

// P1-1/P1-2: the server render saw /en/... and built /ar/en/... switch hrefs and a hydration mismatch on /sellers.
test("/sellers loads without a page error", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/sellers");
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

test("server-rendered language switch hrefs have no /en segment", async ({ request }) => {
  for (const path of ["/", "/privacy", "/sellers", "/welcome"]) {
    const html = await (await request.get(path)).text();
    expect(html, path).not.toMatch(/href="\/ar\/en(\/|")/);
    expect(html, path).toContain(`href="${path === "/" ? "/ar" : "/ar" + path}"`);
  }
});

test("404 HTML carries lang, dir and the page-not-found title before any script runs", async ({ request }) => {
  for (const [path, lang, dir, title] of [["/nope", "en", "ltr", en.web.notFound.title], ["/ar/nope", "ar", "rtl", ar.web.notFound.title]]) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(404);
    const html = await res.text();
    expect(html, path).toMatch(new RegExp(`<html[^>]*lang="${lang}"[^>]*dir="${dir}"`));
    expect(html, path).toContain(`<title>${title} | GitPrice</title>`);
  }
});
