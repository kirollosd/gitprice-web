import { expect, test, type Page } from "./fixtures";
import ar from "../i18n/ar.json";
import en from "../i18n/en.json";

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 800 };
const NAV = (l: typeof en) => l.web.component.webNav;

const formFocused = (page: Page) => expect(page.locator('#dock input[type="email"]')).toBeFocused();

for (const [locale, base, L] of [["en", "", en], ["ar", "/ar", ar]] as const) {
  const home = base || "/";
  test.describe(`${locale}: links from a site page into the landing`, () => {
    test("desktop header: one How it works link (no Features), and the CTA opens the dock form in place, focused", async ({ page }) => {
      await page.setViewportSize(DESKTOP);
      await page.goto(`${base}/pricing`);
      const nav = page.locator("header nav");
      await expect(nav.getByRole("link", { name: NAV(L)["1024"].label.features })).toHaveCount(0);
      await expect(nav.locator('a[data-gp-cta-id="features"]')).toHaveCount(0);
      await expect(nav.getByRole("link", { name: L.web.landing.nav.howItWorks })).toHaveAttribute("href", `${base || "/"}#how`);
      await nav.getByRole("link", { name: L.web.landing.nav.howItWorks }).click();
      await expect(page).toHaveURL(new RegExp(`${base}/?#how$`));
      await expect(page.locator("#how")).toBeInViewport();

      await page.goto(`${base}/pricing`);
      const cta = page.locator('header button[data-gp-cta-id="join_waitlist"]');
      await cta.click();
      await expect(page.locator("#dock")).toHaveClass(/(^|\s)in(\s|$)/);
      await formFocused(page);
      // no navigation: still on the page the visitor was on
      await expect(page).toHaveURL(new RegExp(`${base}/pricing$`));
    });

    test("phone menu sheet: How it works and the CTA reach the landing; the CTA opens the dock form with focus", async ({ page }) => {
      await page.setViewportSize(PHONE);
      await page.goto(`${base}/privacy`);
      await page.locator("header button[aria-expanded]:not(#lng)").click();
      const sheet = page.locator("#web-menu");
      await expect(sheet.locator('a[data-gp-cta-id="features"]')).toHaveCount(0);
      await expect(sheet.locator('a[data-gp-cta-id="how_it_works"]')).toHaveAttribute("href", `${base || "/"}#how`);
      await sheet.locator('a[data-gp-cta-id="how_it_works"]').click();
      await expect(page).toHaveURL(new RegExp(`${base}/?#how$`));

      await page.goto(`${base}/privacy`);
      await page.locator("header button[aria-expanded]:not(#lng)").click();
      await page.locator('#web-menu button[data-gp-cta-id="join_waitlist"]').click();
      await formFocused(page);
      await expect(page).toHaveURL(new RegExp(`${base}/privacy$`));
    });

    for (const path of ["/sellers", "/privacy", "/terms", "/pricing", ""]) {
      test(`${path || "/"}: the dock is there and every Join the waitlist opens it in place`, async ({ page }) => {
        await page.setViewportSize(DESKTOP);
        await page.goto(`${base}${path}`);
        const dock = page.locator("#dock");
        // the landing's dock waits for the hero board (about 4s); the other pages have no hero
        await expect(dock).toHaveClass(/(^|\s)in(\s|$)/, { timeout: 15000 });
        await expect(dock).toBeVisible();
        await page.locator("[data-join]").first().click();
        await formFocused(page);
        await expect(page).toHaveURL(new RegExp(`${base}${path}/?$`));
      });
    }

    test("the dock stays on screen through the whole landing, top to bottom", async ({ page }) => {
      await page.setViewportSize(DESKTOP);
      await page.goto(home);
      const dock = page.locator("#dock");
      await expect(dock).toHaveClass(/(^|\s)in(\s|$)/, { timeout: 15000 });
      for (const y of [0, 1500, 6000, 99999]) {
        await page.evaluate((top) => scrollTo({ top, behavior: "instant" }), y);
        await page.waitForTimeout(300);
        await expect(dock).toBeInViewport();
        await expect(dock).toHaveClass(/(^|\s)in(\s|$)/);
      }
    });
  });
}

test.describe("landing behaviours (parity with the preview)", () => {
  const pressed = (page: Page) => page.locator("#pick [aria-pressed=true]");
  const random = (page: Page, v: number) => page.addInitScript((x) => { Math.random = () => x; }, v);

  test("no ?p=: a random product on load, with no charger flash; ?p= wins", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await random(page, 0.99);
    await page.goto("/");
    await expect(pressed(page)).toHaveText("Diapers");
    await expect(page.locator("html")).not.toHaveAttribute("data-gp-pick", /.*/);
    await random(page, 0.45);
    await page.goto("/");
    await expect(pressed(page)).toHaveText("Skincare");
    await page.goto("/?p=iphone");
    await expect(pressed(page)).toHaveText("iPhone");
    await page.goto("/?p=charger");
    await expect(pressed(page)).toHaveText("Phone charger");
  });

  test("switching products leaves nothing of the previous product in the hero (fast and slow clicks)", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/?p=charger");
    for (const gap of [60, 1500]) {
      for (const name of ["Skincare", "iPhone", "Air fryer"]) {
        await page.locator("#pick button", { hasText: name }).click();
        await page.waitForTimeout(gap);
      }
      await expect(pressed(page)).toHaveText("Air fryer");
      for (const sel of ["#cap", "#digits", "#tags"]) await expect(page.locator(sel)).toHaveCount(1);
      await expect(page.locator("#cap")).toContainText("Philips Airfryer");
      await expect(page.locator("#cap")).not.toContainText(/Anker|iPhone|CeraVe/);
      await expect(page.locator("#digits")).toHaveAttribute("data-to", "4,299");
      await expect(page.locator("#tags")).not.toContainText("same wattage");
      await page.locator("#pick button", { hasText: "Phone charger" }).click();
      await page.waitForTimeout(gap);
    }
  });

  test("the language menu keeps ?p=", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/?p=iphone");
    await page.locator("#lng").click();
    await page.locator("#lmenu [lang=ar]").click();
    await expect(page).toHaveURL(/\/ar\?p=iphone$/);
    await expect(pressed(page)).toHaveText("آيفون");
  });

  test("resizing keeps the visitor at the same place in the same scene", async ({ page }) => {
    await page.goto("/?p=charger");
    await page.evaluate(() => scrollTo({ top: 4200, behavior: "instant" }));
    // let the page see the scroll (its place is tracked from scroll events) before the window changes
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const progress = () => page.evaluate(() => {
      const el = [...document.querySelectorAll<HTMLElement>("[data-gp-section]")].find((e) => { const r = e.getBoundingClientRect(); return r.top <= 0 && r.bottom > 0; })!;
      return [el.dataset.gpSection, Math.round((-el.getBoundingClientRect().top / el.getBoundingClientRect().height) * 20) / 20];
    });
    const start = await progress();
    for (const width of [390, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(progress).toEqual(start);
    }
  });
});

test.describe("Beta tag placement", () => {
  const visible = (page: Page, sel: string) => page.locator(sel).evaluateAll((els) => els.filter((e) => (e as HTMLElement).getClientRects().length > 0).length);

  test("the header carries the tag beside the logo at every width; the hero does not", async ({ page }) => {
    for (const viewport of [PHONE, DESKTOP]) {
      await page.setViewportSize(viewport);
      await page.goto("/");
      expect(await visible(page, "header [data-beta]")).toBe(1);
      expect(await visible(page, "#num [data-beta]")).toBe(0);
    }
  });

  for (const viewport of [DESKTOP, PHONE]) {
    test(`${viewport.width}: the dock keeps its Beta tag while the join form is open`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await page.locator("header [data-join]").click();
      await expect(page.locator("#dock form[data-waitlist]")).toBeVisible();
      await expect(page.locator("#dock [data-beta]")).toBeVisible();
      const [d, b] = await Promise.all([page.locator("#dock").boundingBox(), page.locator("#dock [data-beta]").boundingBox()]);
      expect(b!.x).toBeGreaterThanOrEqual(d!.x);
      expect(b!.x + b!.width).toBeLessThanOrEqual(d!.x + d!.width);
    });
  }
});

test.describe("dock and the cookie notice never overlap", () => {
  const overlap = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
    a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

  for (const path of ["/", "/ar"]) {
    for (const width of [390, 800, 1024, 1100, 1279, 1280, 1440, 1920]) {
      for (const form of [false, true]) {
        test(`${path} at ${width}${form ? " with the form open" : ""}`, async ({ page }) => {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(path);
          if (form) await page.locator("header [data-join]").click();
          const notice = page.getByRole("region", { name: (path === "/" ? en : ar).web.component.webCookieNotice.default.title });
          await expect(notice).toBeVisible();
          if (!form) await page.evaluate(() => document.getElementById("film")!.scrollIntoView());
          const dock = page.locator("#dock");
          await expect(dock).toHaveClass(/(^|\s)in(\s|$)/);
          await expect.poll(async () => {
            const [d, n] = await Promise.all([dock.boundingBox(), notice.boundingBox()]);
            return !overlap(d!, n!) && d!.x >= 0 && d!.x + d!.width <= width + 0.5;
          }).toBe(true);
        });
      }
    }
  }

  test("1440: the dock stays centred and 32px up while the notice shows (the notice rises above it)", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/");
    await page.evaluate(() => document.getElementById("film")!.scrollIntoView());
    await expect(page.locator("#dock")).toHaveClass(/(^|\s)in(\s|$)/);
    expect(await page.locator("#dock").evaluate((e) => getComputedStyle(e).bottom)).toBe("32px");
    await expect.poll(async () => { const d = await page.locator("#dock").boundingBox(); return Math.round(d!.x + d!.width / 2); }).toBe(720);
  });
});
