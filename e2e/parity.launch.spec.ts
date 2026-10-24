import { test } from "@playwright/test";
import { decideConsent, expectParity, LOCALES, sizeToBoard, stubTally, WIDTHS, type Shot } from "./parity-lib";

// Launch project (:3001): the boards that show the launched site (store badges, Add to Chrome).
for (const width of WIDTHS) {
  for (const [base, locale] of LOCALES) {
    for (const [screen, path] of [["Home", "/"], ["Sellers", "/sellers"]] as const) {
      test(`${screen} launch ${width} ${locale}`, async ({ page }) => {
        const s: Shot = { screen, state: "launch", width, locale };
        await stubTally(page);
        await decideConsent(page);
        await sizeToBoard(page, s);
        await page.goto(`${base}${path}`);
        await expectParity(page, s);
      });
    }
  }
}
