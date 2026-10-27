import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

// The wordmark colour comes from --gp-web-logo, which the synced web blocks switch for an explicit dark theme
// and for OS dark with no stored choice, so the logo cannot drift from either.
it("the wordmark follows --gp-web-logo, with no theme rule of its own", () => {
  const css = readFileSync("app/components/Logo.module.css", "utf8");
  expect(css).toMatch(/background-color:\s*var\(--gp-web-logo\)/);
  expect(css).not.toContain("data-theme");
});
