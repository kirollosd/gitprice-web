import { readFileSync } from "node:fs";
import { join } from "node:path";

// Server-only: for places CSS variables cannot reach (metadata, the OG image). Values come from the synced tokens.css.
// Reads the file at render time: safe only while every caller's page is statically prerendered (the file is not traced into a serverless bundle).
const css = () => readFileSync(join(process.cwd(), "styles/tokens.css"), "utf8");
const LIGHT_BLOCK = '[data-gp="web"] {';
const DARK_BLOCK = '[data-gp="web"][data-theme="dark"]';

/** The colour token's value in the light or dark web block of styles/tokens.css; a `var(--gp-web-*)` is resolved in the same block. */
export function tokenColor(name: string, theme: "light" | "dark" = "light"): string {
  const all = css();
  const start = all.indexOf(theme === "dark" ? DARK_BLOCK : LIGHT_BLOCK);
  const block = start < 0 ? "" : all.slice(start, all.indexOf("}", start));
  const read = (n: string) => block.match(new RegExp(`--gp-${n}:\\s*([^;]+);`))?.[1].trim();
  const raw = read(name);
  const ref = raw?.match(/^var\(--gp-(web-[\w-]+)\)$/)?.[1];
  const value = ref ? read(ref) : raw;
  if (!value || !/^#[0-9a-fA-F]{3,8}$/.test(value)) throw new Error(`token --gp-${name} (${theme}) not found in styles/tokens.css`);
  return value;
}
