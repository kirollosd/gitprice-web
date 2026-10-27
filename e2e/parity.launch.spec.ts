import { test } from "./fixtures";
import { decideConsent, expectParity, LOCALES, sizeToBoard, WIDTHS, type Shot } from "./parity-lib";

// Launch project (:3001): the boards that show the launched site (store badges, Add to Chrome).
// Home launch is not compared: the coral landing (GP-406) replaced the board's hero.
for (const width of WIDTHS) {
  for (const [base, locale] of LOCALES) {
    for (const [screen, path] of [["Sellers", "/sellers"]] as const) {
      test(`${screen} launch ${width} ${locale}`, async ({ page }) => {
        const s: Shot = { screen, state: "launch", width, locale };
        await decideConsent(page);
        await sizeToBoard(page, s);
        await page.goto(`${base}${path}`);
        await expectParity(page, s);
      });
    }
  }
}
