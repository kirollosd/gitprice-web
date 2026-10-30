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

const L = en.web.landing;
const PHONE = { width: 390, height: 800 };

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`no horizontal overflow at 390, ${colorScheme}`, () => {
    test.use({ viewport: PHONE, colorScheme });
    for (const path of ["/", "/sellers", "/ar", "/ar/sellers"]) {
      test(path, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator("h1")).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
        expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(390);
      });
    }
    for (const path of ["/", "/ar"]) {
      test(`${path}: the language menu opens inside the viewport`, async ({ page }) => {
        await page.goto(path);
        await page.locator("#lng").click();
        const box = await page.locator("#lmenu").boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(390);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
      });
    }
  });
}

/** Opens the dock's waitlist form from the header Join button and returns the form (the hero's action is See how it works). */
async function openDock(page: Page) {
  await page.locator('header [data-join]').click();
  const form = page.locator("#dock form[data-waitlist]");
  await expect(form).toBeVisible();
  return form;
}
const submit = (page: Page) => page.locator("#dock").getByRole("button", { name: en.web.landing.dock.submit, exact: true });

test.describe("Home prelaunch", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the Beta tag sits by the hero action, the dock CTA and in the footer; no pricing or app-store links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#num [data-beta]")).toHaveCount(0);
    await expect(page.locator("#dock [data-beta]")).toHaveCount(1);
    await expect(page.locator("footer [data-beta]")).toHaveCount(1);
    await expect(page.locator('a[href*="pricing"], a[data-gp-store="app_store"], a[data-gp-store="play"]')).toHaveCount(0);
  });

  test("has the nav anchors and one dock waitlist form, no Tally", async ({ page }) => {
    const tally: string[] = [];
    page.on("request", (r) => { if (r.url().includes("tally.so")) tally.push(r.url()); });
    await page.goto("/");
    for (const id of ["how", "film", "spot", "rcpt"]) await expect(page.locator(`#${id}`)).toHaveCount(1);
    await expect(page.locator("form[data-waitlist]")).toHaveCount(0); // the one form lives in the dock and mounts when it opens
    const form = await openDock(page);
    await expect(page.locator("form[data-waitlist]")).toHaveCount(1);
    const email = form.getByLabel(W.empty.input.email.label);
    await expect(email).toHaveAttribute("type", "email");
    await expect(email).toBeFocused();
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Add GitPrice to Chrome" })).toHaveCount(0);
    expect(tally).toEqual([]);
  });

  test("the header Join opens the dock form, 201 joins, and every Join button reads joined", async ({ page }) => {
    const bodies = await stubWaitlist(page, [201]);
    await page.goto("/");
    const form = await openDock(page);
    await form.getByLabel(W.empty.input.email.label).fill("sara@example.com");
    await submit(page).click();
    await expect(page.locator("#dt")).toHaveText(L.dock.done);
    await expect(page.locator("#dt")).toBeFocused();
    await expect(page.locator("form[data-waitlist]")).toHaveCount(0);
    await expect(page.locator('[data-join][data-gp-placement="nav"]')).toHaveText(L.dock.joined);
    expect(bodies).toEqual([{ email: "sara@example.com", audience: "shopper", locale: "en", website: "" }]);
    const events = await page.evaluate(() => ((window as unknown as { dataLayer: { event?: string; placement?: string }[] }).dataLayer)
      .filter((e) => e.event === "waitlist_submit").map((e) => e.placement));
    expect(events).toEqual(["dock"]);
  });

  test("an address already on the list (200) also ends joined", async ({ page }) => {
    const bodies = await stubWaitlist(page, [200]);
    await page.goto("/");
    const form = await openDock(page);
    await form.getByLabel(W.empty.input.email.label).fill("Sara@Example.com");
    await submit(page).click();
    await expect(page.locator("#dt")).toHaveText(L.dock.done);
    expect(bodies).toEqual([{ email: "Sara@Example.com", audience: "shopper", locale: "en", website: "" }]);
  });

  test("Esc closes the dock form and returns focus to the Join button", async ({ page }) => {
    await page.goto("/");
    const join = page.locator('header [data-join]');
    await openDock(page);
    await page.keyboard.press("Escape");
    await expect(page.locator("form[data-waitlist]")).toHaveCount(0);
    await expect(join).toBeFocused();
  });

  test("an invalid address shows the error under the field and sends nothing", async ({ page }) => {
    const bodies = await stubWaitlist(page);
    await page.goto("/");
    const form = await openDock(page);
    const email = form.getByLabel(W.empty.input.email.label);
    await email.fill(W.error.input.email.value);
    await submit(page).click();
    await expect(form.getByText(W.error.input.email.message)).toBeVisible();
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
    const form = await openDock(page);
    await form.getByLabel(W.empty.input.email.label).fill("sara@example.com");
    await submit(page).dblclick();
    const busy = form.getByRole("button", { name: W.submitting.button.submit.label });
    await expect(busy).toBeDisabled();
    await expect(form).toHaveAttribute("aria-busy", "true");
    release();
    await expect(page.locator("#dt")).toHaveText(L.dock.done);
    expect(requests).toBe(1);
  });

  test("an unreachable API shows failed, keeps the email, and Try again retries", async ({ page }) => {
    let calls = 0;
    await page.route("**/api/v1/waitlist", (route) => (++calls === 1 ? route.abort("connectionrefused") : route.fulfill(waitlistReply(201))));
    await page.goto("/");
    const form = await openDock(page);
    const email = form.getByLabel(W.empty.input.email.label);
    await email.fill("sara@example.com");
    await submit(page).click();
    await expect(form.getByRole("alert")).toHaveText(W.failed.message);
    await expect(email).toHaveValue("sara@example.com");
    await form.getByRole("button", { name: W.failed.button.submit.label }).click();
    await expect(page.locator("#dt")).toHaveText(L.dock.done);
    expect(calls).toBe(2);
  });

  test("Arabic is right to left while the email field stays left to right", async ({ page }) => {
    const A = ar.web.component.webWaitlistForm;
    const bodies = await stubWaitlist(page, [503]);
    await page.goto("/ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const form = await openDock(page);
    const email = form.locator('input[type="email"]');
    await expect(email).toHaveAttribute("dir", "ltr");
    expect(await email.evaluate((e) => getComputedStyle(e).direction)).toBe("ltr");
    await email.fill("sara@example");
    await form.locator('button[type="submit"]').click();
    const message = form.getByText(A.error.input.email.message);
    expect(await message.evaluate((e) => getComputedStyle(e).direction)).toBe("rtl");
    await email.fill("sara@example.com");
    await form.locator('button[type="submit"]').click();
    await expect(form.getByRole("alert")).toHaveText(A.failed.message);
    expect(bodies).toEqual([{ email: "sara@example.com", audience: "shopper", locale: "ar", website: "" }]);
  });

  test("the header Join opens the dock form and the sellers link opens Sellers", async ({ page }) => {
    await page.goto("/");
    await page.locator('header [data-join]').click();
    await expect(page.locator("#dock form[data-waitlist] input[type=email]")).toBeFocused();
    await page.locator("header").getByRole("link", { name: "GitPrice for marketplace sellers" }).click();
    await expect(page).toHaveURL(/\/sellers$/);
  });

  test("the five header links point at the landing sections", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("header nav");
    for (const [id, label] of [["how", L.nav.howItWorks], ["film", L.nav.watchLive], ["spot", L.nav.matchChallenge], ["rcpt", L.nav.savings]]) {
      await expect(nav.getByRole("link", { name: label })).toHaveAttribute("href", `/#${id}`);
    }
  });

  test("the dock shows at the film and stays over #foot (the preview's dockIn)", async ({ page }) => {
    await page.goto("/");
    const dock = page.locator("#dock");
    const shown = /(^|\s)in(\s|$)/;
    await page.evaluate(() => document.getElementById("film")!.scrollIntoView());
    await expect(dock).toHaveClass(shown);
    await page.evaluate(() => document.getElementById("foot")!.scrollIntoView());
    await expect(dock).toHaveClass(shown);
  });
});

test.describe("phone tap targets (44 px)", () => {
  test.use({ viewport: PHONE });
  const TARGETS: [string, string][] = [
    ["language button", "#lng"],
    ["header CTA", "header [data-join]"],
    ["dock CTA", "#dgo"],
    ["product chips", "#pick button"],
    ["with / without toggle", "#tWith, #tWithout"],
    ["footer CTAs", "#foot [data-join], #foot a"],
    ["video play", "#vpp"],
    ["chapters", "#chap button"],
    ["logo link", "header a:first-of-type"],
  ];
  for (const path of ["/", "/ar"]) {
    test(`${path}: every listed control is at least 44 px square`, async ({ page }) => {
      await page.goto(path);
      for (const [name, sel] of TARGETS) {
        const sizes = await page.locator(sel).evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); const a = getComputedStyle(e, "::after"); /* a ::after pad is the hit area */ const pad = a.position === "absolute" ? [parseFloat(a.width) || 0, parseFloat(a.height) || 0] : [0, 0]; return [Math.round(Math.max(r.width, pad[0]) * 10) / 10, Math.round(Math.max(r.height, pad[1]) * 10) / 10]; }));
        expect(sizes.length, `${name} (${sel}) exists`).toBeGreaterThan(0);
        for (const [w, h] of sizes) {
          if (w === 0 && h === 0) continue; // a control the phone layout hides (the mock hides the hero CTA)
          expect(w, `${name} width`).toBeGreaterThanOrEqual(43.9);
          expect(h, `${name} height`).toBeGreaterThanOrEqual(43.9);
        }
      }
    });
  }
});

// Review Focus 1 and 5. The grounds are the web token values for the two looks (styles/tokens.css).
const GROUND = { light: "rgb(244, 244, 245)", dark: "rgb(10, 10, 11)" };

test.describe("theme", () => {
  test.use({ colorScheme: "light" });

  test("a stored dark choice on a light OS paints dark before load", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("gp-theme", "dark");
      document.addEventListener("DOMContentLoaded", () => {
        (window as unknown as { __early: unknown }).__early = {
          theme: document.documentElement.dataset.theme,
          bg: getComputedStyle(document.body).backgroundColor,
        };
      });
    });
    await page.goto("/");
    const early = await page.evaluate(() => (window as unknown as { __early: { theme?: string; bg: string } }).__early);
    expect(early.theme).toBe("dark");
    expect(early.bg).toBe(GROUND.dark);
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(GROUND.dark);
  });

  test("with no stored choice the OS scheme drives the theme at runtime; after a toggle it no longer does", async ({ page }) => {
    const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const toggle = page.getByRole("button", { name: /Switch to (dark|light)/ });
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
    expect(await bg()).toBe(GROUND.light);
    await page.emulateMedia({ colorScheme: "dark" });
    await expect.poll(bg).toBe(GROUND.dark);
    await expect(toggle).toHaveAttribute("aria-label", L.theme.toLight);
    await toggle.click(); // OS is dark, so this chooses light
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(await bg()).toBe(GROUND.light);
    await page.emulateMedia({ colorScheme: "light" });
    await page.emulateMedia({ colorScheme: "dark" });
    expect(await bg()).toBe(GROUND.light);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(await page.evaluate(() => localStorage.getItem("gp-theme"))).toBe("light");
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
    // the header CTA opens the dock's waitlist, as on every page (the seller form stays in the page)
    await header.getByRole("button", { name: "Join the waitlist" }).click();
    await expect(page.locator('#dock input[type="email"]')).toBeFocused();
  });

  test("uses the short back label at 1280", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/ar/sellers");
    await expect(page.locator("header").getByRole("link", { name: "للمتسوقين", exact: true })).toBeVisible();
  });
});

test.describe("coral polish (GP-406 F1, F2, F4)", () => {
  test("desktop: hero h1 is weight 400 and the dock sits 32px up, not lifted over the cookie notice", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    expect(await page.locator("h1").first().evaluate((e) => getComputedStyle(e).fontWeight)).toBe("400");
    expect(await page.locator("#dock").evaluate((e) => getComputedStyle(e).bottom)).toBe("32px");
  });

  test("phone: the shown dock stays put and the cookie notice sits above it, never over it", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/");
    const notice = page.getByRole("region", { name: en.web.component.webCookieNotice.default.title });
    await expect(notice).toBeVisible();
    await page.evaluate(() => document.getElementById("film")!.scrollIntoView());
    const dock = page.locator("#dock");
    await expect(dock).toHaveClass(/(^|\s)in(\s|$)/);
    await expect.poll(async () => {
      const [d, n] = await Promise.all([dock.boundingBox(), notice.boundingBox()]);
      return n!.y + n!.height <= d!.y + 0.5;
    }).toBe(true);
  });

  test("phone: the footer Cookie settings button has a 44px hit area", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/");
    const btn = page.locator("footer button", { hasText: /cookie/i }).first();
    await btn.scrollIntoViewIfNeeded();
    // the .hit-target layer (not the 18px box) carries the 44px; the cookie notice may cover the button on a first visit
    // inside the zoomed canvas the computed height carries float noise (43.9992)
    expect(await btn.evaluate((b) => parseFloat(getComputedStyle(b, "::after").height))).toBeGreaterThanOrEqual(43.9);
  });
});

test.describe("hero strike and landmarks", () => {
  test("the caption price is struck by the board's Coral bar, not a text-decoration; the home page has one contentinfo", async ({ page }) => {
    await page.goto("/?p=charger");
    const cap = await page.locator("#cap s").evaluate((el) => {
      const p = el.firstElementChild!, after = getComputedStyle(p, "::after");
      return { deco: getComputedStyle(p).textDecorationLine, display: getComputedStyle(p).display, content: after.content, h: after.height, bg: after.backgroundColor };
    });
    // the <s> itself still carries line-through, but its inline-block price stops it propagating: only the bar strikes
    expect(cap.display).toBe("inline-block");
    expect(cap.deco).not.toContain("line-through");
    expect(cap.content).toBe('""');
    expect(parseFloat(cap.h)).toBeCloseTo(3, 0); // the canvas zoom scales it a hair
    expect(cap.bg).not.toBe("rgba(0, 0, 0, 0)");
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
  });
});

for (const width of [390, 1024]) {
  test(`the dock and the cookie notice never cover the last footer row on a site page (${width})`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/privacy");
    await page.locator("#dock").waitFor({ state: "visible" });
    // the notice mounts after hydration and lifts the dock: measure with both in place
    const noticeBox = page.getByRole("region", { name: en.web.component.webCookieNotice.default.title });
    await expect(noticeBox).toBeVisible();
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--gp-stack-h"))).not.toBe("");
    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
    const row = page.locator("footer button", { hasText: /cookie/i }).first();
    // the dock slides up over 0.7 s when the notice appears: poll until it settles
    await expect.poll(async () => {
      const [dock, notice, r] = await Promise.all([page.locator("#dock").boundingBox(), noticeBox.boundingBox(), row.boundingBox()]);
      return r!.y + r!.height <= Math.min(dock!.y, notice!.y) + 0.5;
    }).toBe(true);
  });
}

// Owner rule (GP-407, PR #66): every waitlist CTA is the same coral primary, nav and dock included, in both themes.
for (const colorScheme of ["light", "dark"] as const) {
  for (const viewport of [{ width: 1440, height: 900 }, PHONE]) {
    test(`${viewport.width} ${colorScheme}: every waitlist CTA has the same fill, text, radius and weight`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme });
      await page.goto("/");
      await page.evaluate(() => document.getElementById("foot")!.scrollIntoView()); // the dock is up over the footer
      await expect(page.locator("#dgo")).toBeVisible();
      const looks = await page.locator("[data-join], #dgo").evaluateAll((els) => els.filter((e) => e.getClientRects().length > 0).map((e) => {
        const c = getComputedStyle(e);
        return [c.backgroundColor, c.color, c.borderRadius, c.fontWeight].join(" ");
      }));
      expect(looks.length).toBeGreaterThanOrEqual(3); // nav, dock, footer (the hero's action is the secondary See how it works)
      expect(new Set(looks).size, looks.join("\n")).toBe(1);
      expect(looks[0]).toBe("rgb(255, 90, 78) rgb(10, 10, 11) 8px 600");
    });
  }
}

test("the hero has no waitlist CTA: its one action is the secondary See how it works, arrow on the label's line", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const path of ["/", "/ar"]) {
    await page.goto(path);
    await expect(page.locator("#num [data-join], #num .gp-btn")).toHaveCount(0);
    const link = page.locator('#num a[href="#how"]');
    await expect(link).toHaveClass(/\bgp-btn-2\b/);
    expect(await link.evaluate((a) => a.getBoundingClientRect().height)).toBeGreaterThanOrEqual(47.9);
    const [label, arrow] = await link.evaluate((a) => [a.getBoundingClientRect(), a.lastElementChild!.getBoundingClientRect()].map((r) => r.top + r.height / 2));
    expect(Math.abs(label - arrow)).toBeLessThan(2);
    expect(await link.evaluate((a) => a.getClientRects().length)).toBe(1);
  }
});
