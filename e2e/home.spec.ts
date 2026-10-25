import { expect, test, type Page } from "./fixtures";
import { waitlistReply } from "./parity-lib";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

const W = en.web.component.webWaitlistForm;

/** Stubs POST /api/v1/waitlist with the given replies in order (the last one repeats) and records each request body. */
async function stubWaitlist(page: Page, replies: Parameters<typeof waitlistReply>[0][] = [201]) {
  const bodies: Record<string, string>[] = [];
  await page.route("**/api/v1/waitlist", (route) => {
    bodies.push(route.request().postDataJSON());
    const status = replies[Math.min(bodies.length - 1, replies.length - 1)];
    return route.fulfill(waitlistReply(status, status === 400 ? "INVALID_EMAIL" : "UNAVAILABLE"));
  });
  return bodies;
}

test.describe("no horizontal overflow at 390", () => {
  test.use({ viewport: { width: 390, height: 800 } });
  for (const path of ["/", "/sellers", "/ar", "/ar/sellers"]) {
    test(path, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
      expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(390);
    });
  }
});

test.describe("Home prelaunch", () => {
  test("has the nav anchors and two native waitlist forms, no Tally", async ({ page }) => {
    const tally: string[] = [];
    page.on("request", (r) => { if (r.url().includes("tally.so")) tally.push(r.url()); });
    await page.goto("/");
    for (const id of ["features", "how-it-works", "waitlist"]) await expect(page.locator(`#${id}`)).toHaveCount(1);
    await expect(page.locator("form[data-waitlist]")).toHaveCount(2);
    const email = page.locator("#waitlist").getByLabel(W.empty.input.email.label);
    await expect(email).toHaveAttribute("type", "email");
    await expect(email).toHaveAttribute("placeholder", W.empty.input.email.placeholder);
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Add GitPrice to Chrome" })).toHaveCount(0);
    expect(tally).toEqual([]);
  });

  test("hero joins (201) and the bottom form then answers already joined (200)", async ({ page }) => {
    const bodies = await stubWaitlist(page, [201, 200]);
    await page.goto("/");
    const hero = page.locator("#waitlist");
    await hero.getByLabel(W.empty.input.email.label).fill("sara@example.com");
    await hero.getByRole("button", { name: W.empty.button.submit.label }).click();
    await expect(hero.getByRole("heading", { name: W.joined.title })).toBeFocused();
    await expect(hero.getByText(W.joined.body)).toBeVisible();
    const bottom = page.locator('[data-gp-section="bottom_cta"]');
    await bottom.getByLabel(W.empty.input.email.label).fill("Sara@Example.com");
    await bottom.getByRole("button", { name: W.empty.button.submit.label }).click();
    await expect(bottom.getByRole("heading", { name: W.alreadyJoined.title })).toBeVisible();
    await expect(bottom.getByText(W.alreadyJoined.body)).toBeVisible();
    expect(bodies).toEqual([
      { email: "sara@example.com", audience: "shopper", locale: "en", website: "" },
      { email: "Sara@Example.com", audience: "shopper", locale: "en", website: "" },
    ]);
    const events = await page.evaluate(() => ((window as unknown as { dataLayer: { event?: string; placement?: string }[] }).dataLayer)
      .filter((e) => e.event === "waitlist_submit").map((e) => e.placement));
    expect(events).toEqual(["hero", "bottom"]);
  });

  test("an invalid address shows the error under the field and sends nothing", async ({ page }) => {
    const bodies = await stubWaitlist(page);
    await page.goto("/");
    const hero = page.locator("#waitlist");
    const email = hero.getByLabel(W.empty.input.email.label);
    await email.fill(W.error.input.email.value);
    await hero.getByRole("button", { name: W.empty.button.submit.label }).click();
    await expect(hero.getByText(W.error.input.email.message)).toBeVisible();
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(email).toBeFocused();
    expect(bodies).toHaveLength(0);
  });

  test("a double click sends one request and the button is disabled while submitting", async ({ page }) => {
    let release = () => {};
    const gate = new Promise<void>((r) => { release = r; });
    let requests = 0;
    await page.route("**/api/v1/waitlist", async (route) => { requests++; await gate; await route.fulfill(waitlistReply(201)); });
    await page.goto("/");
    const hero = page.locator("#waitlist");
    await hero.getByLabel(W.empty.input.email.label).fill("sara@example.com");
    await hero.getByRole("button", { name: W.empty.button.submit.label }).dblclick();
    const busy = hero.getByRole("button", { name: W.submitting.button.submit.label });
    await expect(busy).toBeDisabled();
    await expect(hero.locator("form")).toHaveAttribute("aria-busy", "true");
    release();
    await expect(hero.getByRole("heading", { name: W.joined.title })).toBeVisible();
    expect(requests).toBe(1);
  });

  test("an unreachable API shows failed, keeps the email, and Try again retries", async ({ page }) => {
    let calls = 0;
    await page.route("**/api/v1/waitlist", (route) => (++calls === 1 ? route.abort("connectionrefused") : route.fulfill(waitlistReply(201))));
    await page.goto("/");
    const hero = page.locator("#waitlist");
    const email = hero.getByLabel(W.empty.input.email.label);
    await email.fill("sara@example.com");
    await hero.getByRole("button", { name: W.empty.button.submit.label }).click();
    await expect(hero.getByRole("alert")).toHaveText(W.failed.message);
    await expect(email).toHaveValue("sara@example.com");
    await hero.getByRole("button", { name: W.failed.button.submit.label }).click();
    await expect(hero.getByRole("heading", { name: W.joined.title })).toBeVisible();
    expect(calls).toBe(2);
  });

  test("Arabic is right to left while the email field stays left to right", async ({ page }) => {
    const A = ar.web.component.webWaitlistForm;
    const bodies = await stubWaitlist(page, [503]);
    await page.goto("/ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const hero = page.locator("#waitlist");
    const email = hero.getByLabel(A.empty.input.email.label);
    await expect(email).toHaveAttribute("dir", "ltr");
    expect(await email.evaluate((e) => getComputedStyle(e).direction)).toBe("ltr");
    await email.fill("sara@example");
    await hero.getByRole("button", { name: A.empty.button.submit.label }).click();
    const message = hero.getByText(A.error.input.email.message);
    expect(await message.evaluate((e) => getComputedStyle(e).direction)).toBe("rtl");
    await email.fill("sara@example.com");
    await hero.getByRole("button", { name: A.error.button.submit.label }).click();
    await expect(hero.getByRole("alert")).toHaveText(A.failed.message);
    expect(bodies).toEqual([{ email: "sara@example.com", audience: "shopper", locale: "ar", website: "" }]);
  });

  test("nav CTA targets the waitlist and the sellers link opens Sellers", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator("header").getByRole("link", { name: "Join the waitlist" })).toHaveAttribute("href", "/#waitlist");
    await page.locator("header").getByRole("link", { name: "GitPrice for marketplace sellers" }).click();
    await expect(page).toHaveURL(/\/sellers$/);
  });
});

test.describe("Sellers prelaunch", () => {
  test("shows the seller waitlist, and the nav points back to shoppers", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/sellers");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Know which listings a rival undercuts.");
    const bodies = await stubWaitlist(page);
    const hero = page.locator("#waitlist");
    await hero.getByLabel(W.empty.input.email.label).fill("sara@example.com");
    await hero.getByRole("button", { name: en.web.sellers.prelaunch.hero.waitlist.button.submitLabel }).click();
    await expect(hero.getByText(en.web.sellers.prelaunchJoined.hero.waitlist.body)).toBeVisible();
    expect(bodies[0]).toMatchObject({ audience: "seller", locale: "en" });
    const header = page.locator("header");
    await expect(header.getByRole("link", { name: "GitPrice for shoppers" })).toHaveAttribute("href", "/");
    await expect(header.getByRole("link", { name: "Join the waitlist" })).toHaveAttribute("href", "#waitlist");
  });

  test("uses the short back label at 1024", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto("/ar/sellers");
    await expect(page.locator("header").getByRole("link", { name: "للمتسوقين", exact: true })).toBeVisible();
  });
});
