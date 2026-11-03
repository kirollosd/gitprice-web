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

test("Referrer-Policy on the real responses", async ({ request }) => {
  for (const p of ["/auth/confirm", "/auth/confirmed", "/ar/auth/confirm", "/ar/auth/confirmed", "/reset-password", "/ar/reset-password"]) {
    expect((await request.get(p)).headers()["referrer-policy"], p).toBe("no-referrer");
  }
  for (const p of ["/privacy", "/ar/privacy"]) expect((await request.get(p)).headers()["referrer-policy"], p).toBe("strict-origin-when-cross-origin");
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

// The scrub must run before GTM: if it stops running (a future CSP, a moved script) the recorded href carries the secret and these fail.
const SECRET_URLS = [
  "/auth/confirmed" + TOKENS,
  "/ar/auth/confirmed" + TOKENS,
  "/auth/confirm?token_hash=SECRET&type=signup",
  "/ar/auth/confirm?lang=ar&token_hash=SECRET&type=signup",
  "/reset-password?token_hash=SECRET&type=recovery",
  "/ar/reset-password?token_hash=SECRET&type=recovery",
  "/reset-password#access_token=SECRET&refresh_token=SECRET&type=recovery",
  "/privacy#access_token=SECRET&refresh_token=SECRET",
  "/checkout/return#rt=SECRET",
  "/ar/checkout/return#rt=SECRET&status=ok",
];
for (const url of SECRET_URLS) {
  test(`GTM never sees a token in page_location: ${url}`, async ({ page }) => {
    await page.route("https://www.googletagmanager.com/**", (r) =>
      r.fulfill({ contentType: "text/javascript", body: "window.__gtmHref = location.href;" }));
    await page.goto(url);
    await page.waitForFunction(() => "__gtmHref" in window);
    const href = await page.evaluate(() => (window as unknown as { __gtmHref: string }).__gtmHref);
    expect(href).not.toMatch(/SECRET|token|type=|access_/);
    expect(await page.evaluate(() => "__gpTake" in window && Object.keys(window).includes("__gpTake"))).toBe(false);
  });
}

test("the stash is not enumerable, and is one-shot", async ({ page }) => {
  // /auth/confirmed has no consumer, so the value is still waiting for us (the confirm page reads it on mount).
  await page.goto("/auth/confirmed?token_hash=SECRET&type=signup");
  const r = await page.evaluate(() => {
    const w = window as unknown as { __gpTake?: () => { search: string } | null };
    const listed = Object.keys(window).includes("__gpTake");
    const first = w.__gpTake?.();
    return { listed, first: first?.search, again: typeof w.__gpTake };
  });
  expect(r).toEqual({ listed: false, first: "?token_hash=SECRET&type=signup", again: "undefined" });
});

test("recovery link: confirm page click reaches the reset form with no token in any URL", async ({ page }) => {
  const urls: string[] = [];
  page.on("framenavigated", (f) => urls.push(f.url()));
  await page.route("**/auth/v1/**", (r) => r.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ code: 403, error_code: "otp_expired", msg: "x" }) }));
  await page.goto("/auth/confirm?token_hash=SECRET&type=recovery");
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page).toHaveURL(/\/reset-password$/);
  await expect(page.getByRole("heading", { name: "This link has expired" })).toBeVisible();
  // urls[0] is the request URL as the email link had it; the head script strips it before anything can read it.
  expect(urls.slice(1).join("\n")).not.toContain("SECRET");
});

test("a 5xx from Supabase keeps the button and says to try again", async ({ page }) => {
  await page.route("**/auth/v1/verify", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  await page.goto("/auth/confirm?token_hash=SECRET&type=signup");
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByText("Your link is still valid")).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm" })).toBeEnabled();
});
