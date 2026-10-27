import { test } from "./fixtures";
import { PINNED, prepare, shoot, SIZES, THEMES, type Width } from "./visual-lib";
import { expect } from "@playwright/test";

// Launch build (:3001, or the preview when its mode is launch): Add to Chrome only (phase 1), Beta tag, no app badges.
test.use({ reducedMotion: "reduce", ...PINNED });

const PAGES = [["home", "/"], ["home-ar", "/ar"], ["sellers", "/sellers"]] as const;

for (const width of Object.keys(SIZES).map(Number) as Width[]) {
  for (const colorScheme of THEMES) {
    test.describe(`launch ${width} ${colorScheme}`, () => {
      test.use({ viewport: SIZES[width], colorScheme });
      test.beforeEach(({ page }) => prepare(page));

      for (const [name, path] of PAGES) {
        test(`${name} full page`, async ({ page }) => {
          await page.goto(path);
          await shoot(page, `launch-${name}-${width}-${colorScheme}`, { fullPage: true });
        });
      }

      test("dock shows Add to Chrome", async ({ page }) => {
        await page.goto("/");
        await page.evaluate(() => document.querySelector("#film")?.scrollIntoView());
        await expect(page.locator('#dock a[data-gp-store="chrome"]')).toBeVisible();
        await shoot(page, `launch-dock-${width}-${colorScheme}`);
      });
    });
  }
}
