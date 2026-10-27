// Renders app/[locale]/og-ar.png, the Arabic share card, in Chromium (Satori cannot shape Arabic).
// Re-run after the Arabic hero headline, the wordmark or the tokens change: node scripts/render-og-ar.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
const W = process.cwd(), OUT = join(W, "app/[locale]/og-ar.png");
const require = createRequire(join(W, "package.json"));
const { chromium } = require("@playwright/test");
const css = readFileSync(join(W, "styles/tokens.css"), "utf8");
const tok = (n) => css.match(new RegExp(`--gp-${n}:\\s*(#[0-9a-fA-F]{3,8})`))[1];
const b64 = (p) => readFileSync(join(W, p)).toString("base64");
const headline = JSON.parse(readFileSync(join(W, "i18n/ar.json"), "utf8")).web.landing.hero.headline;
const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face{font-family:Alexandria;font-weight:600;src:url(data:font/woff2;base64,${b64("public/fonts/alexandria-arabic-600-normal.woff2")}) format("woff2")}
html,body{margin:0}
.card{box-sizing:border-box;width:1200px;height:630px;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;padding:80px;background:${tok("web-ground")};border-bottom:16px solid ${tok("web-fill")};font-family:Alexandria}
h1{margin:0;color:${tok("web-ink")};font-size:72px;font-weight:600;line-height:1.3;max-width:1040px;text-wrap:balance}
img{display:block}
</style></head><body><div class="card"><img src="data:image/svg+xml;base64,${Buffer.from(readFileSync(join(W, "public/logo_wordmark.svg"), "utf8").replaceAll("#2D415E", tok("web-logo"))).toString("base64")}" width="278" height="80" alt=""><h1>${headline}</h1></div></body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
writeFileSync(OUT, await page.locator(".card").screenshot({ type: "png" }));
await browser.close();
console.log("ok", OUT);
