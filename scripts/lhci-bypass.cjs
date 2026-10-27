// lhci puppeteerScript: runs before each audited URL. Trades the Vercel automation bypass secret for the deployment's
// `_vercel_jwt` cookie. The header is added only to requests for the deployment's own origin, so the secret never reaches
// third parties and never ends up in a Lighthouse report (unlike collect.settings.extraHeaders).
module.exports = async (browser, context) => {
  const secret = process.env.VERCEL_BYPASS_SECRET;
  if (!secret) return;
  const origin = new URL(context.url).origin;
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (new URL(req.url()).origin === origin) {
      req.continue({ headers: { ...req.headers(), "x-vercel-protection-bypass": secret, "x-vercel-set-bypass-cookie": "true" } });
    } else req.continue();
  });
  await page.goto(context.url);
  await page.close();
};
