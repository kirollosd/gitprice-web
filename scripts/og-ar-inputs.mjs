// Hash of everything that shapes the Arabic share card; render-og-ar.mjs records it, tests/og.test.ts compares it.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const AR_FONT = "public/fonts/alexandria-arabic-400-normal.woff2";
export const AR_INPUTS = ["scripts/render-og-ar.mjs", AR_FONT, "public/logo_wordmark.svg", "styles/tokens.css", "i18n/ar.json"];
export const arInputsHash = (root) => {
  const h = createHash("sha256");
  for (const p of AR_INPUTS) h.update(p).update(readFileSync(join(root, p)));
  return h.digest("hex");
};
