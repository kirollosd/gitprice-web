import { readFileSync } from "node:fs";
import { join } from "node:path";

// Server-only: for places CSS variables cannot reach (metadata, the OG image). Values come from the synced tokens.css.
const css = () => readFileSync(join(process.cwd(), "styles/tokens.css"), "utf8");
const DARK_BLOCK = '[data-gp="app"][data-theme="dark"]';

/** The colour token's value in the light (first) or dark app block of styles/tokens.css. */
export function tokenColor(name: string, theme: "light" | "dark" = "light"): string {
  const all = css();
  const start = theme === "dark" ? all.indexOf(DARK_BLOCK) : 0;
  const hit = all.slice(start).match(new RegExp(`--gp-${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  if (start < 0 || !hit) throw new Error(`token --gp-${name} (${theme}) not found in styles/tokens.css`);
  return hit[1];
}
