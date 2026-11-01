import { expect, test } from "./fixtures";

const TOKENS = "#access_token=SECRET&refresh_token=SECRET&type=signup";

for (const [base, dir, title, body] of [
  ["", "ltr", "Email confirmed", "Go back to the GitPrice extension and sign in."],
  ["/ar", "rtl", "تم تأكيد بريدك الإلكتروني", "عُد إلى إضافة GitPrice وسجّل الدخول."],
] as const) {
  test(`${base || "/en"}/auth/confirmed scrubs a token fragment and says to return to the extension`, async ({ page }) => {
    await page.goto(`${base}/auth/confirmed${TOKENS}`);
    await expect(page.locator("html")).toHaveAttribute("dir", dir);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.locator("main")).toContainText(body);
    expect(await page.evaluate(() => location.hash)).toBe("");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
}

test("?lang=ar lands on the Arabic page", async ({ page }) => {
  await page.goto("/auth/confirmed?lang=ar#");
  await expect(page).toHaveURL(/\/ar\/auth\/confirmed$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("auth pages send no Referer", async ({ request }) => {
  const res = await request.get("/auth/confirmed");
  expect(res.headers()["referrer-policy"]).toBe("no-referrer");
  expect((await request.get("/privacy")).headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});

test("/auth/confirm spends the token only on click, and removes it from the URL first", async ({ page }) => {
  const calls: string[] = [];
  await page.route("**/auth/v1/verify", async (route) => {
    calls.push(route.request().postData() ?? "");
    await route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ code: 403, error_code: "otp_expired", msg: "expired" }) });
  });
  await page.goto("/auth/confirm?token_hash=abc123&type=signup");
  await expect(page.getByRole("button", { name: "Confirm" })).toBeEnabled();
  expect(new URL(page.url()).search).toBe("");
  expect(calls).toEqual([]);
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This link didn’t work");
  expect(calls).toHaveLength(1);
  expect(calls[0]).toContain("abc123");
});

test("the fragment is gone before GTM runs (GA4 never sees it in page_location)", async ({ page }) => {
  await page.route("https://www.googletagmanager.com/**", (r) =>
    r.fulfill({ contentType: "text/javascript", body: "window.__gtmHref = location.href;" }));
  await page.goto("/auth/confirmed" + TOKENS);
  await page.waitForFunction(() => "__gtmHref" in window);
  expect(await page.evaluate(() => (window as unknown as { __gtmHref: string }).__gtmHref)).not.toMatch(/token|SECRET|type=/);
});
