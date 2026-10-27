import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import ar from "../i18n/ar.json";
import en from "../i18n/en.json";
import { products } from "../app/landing/products";

const css = readFileSync(join(__dirname, "../app/globals.css"), "utf8");

/** The unicode-range of the @font-face that serves `file`, as a predicate on code points. */
function rangeOf(file: string): (cp: number) => boolean {
  const block = css.match(new RegExp(`@font-face \\{[^}]*${file}[^}]*\\}`))?.[0] ?? "";
  const list = block.match(/unicode-range:\s*([^;]+);/)?.[1] ?? "";
  const spans = [...list.matchAll(/U\+([0-9A-F]+)(?:-([0-9A-F]+))?/gi)].map((m) => [parseInt(m[1], 16), parseInt(m[2] ?? m[1], 16)] as const);
  expect(spans.length, file).toBeGreaterThan(0);
  return (cp) => spans.some(([a, b]) => cp >= a && cp <= b);
}

// scripts/subset-fonts.sh cuts the *-core-* files to these ranges. Text outside them still renders (the full file serves it),
// but a word that mixes the two files loses its Arabic joining / kerning, so new copy has to stay inside or the ranges grow.
const copy = JSON.stringify([en, ar, products]);
const chars = [...new Set(copy)].map((c) => c.codePointAt(0)!);
const fullArabic = rangeOf("alexandria-arabic-400-normal"); // the pre-subset range: what the face claimed to cover
const fullLatin = rangeOf("outfit-latin-400-normal");

describe("core font subsets cover the copy", () => {
  it("every Arabic character in the copy is in the Arabic core range", () => {
    const core = rangeOf("alexandria-arabic-core-400-normal");
    expect(chars.filter((c) => fullArabic(c) && !core(c)).map((c) => c.toString(16))).toEqual([]);
  });
  // U+2066-2069 (bidi isolates) are default-ignorable: they draw nothing and never pick a face, so they are left out of the range.
  it("every Latin character in the copy is in the Latin core range", () => {
    const core = rangeOf("outfit-latin-core-400-normal");
    expect(chars.filter((c) => fullLatin(c) && !core(c) && c > 0x1f && c !== 0x7f && !(c >= 0x2066 && c <= 0x2069)).map((c) => c.toString(16))).toEqual([]);
  });
});

// The browser takes a character in a core file's unicode-range from that file and never falls back to the full one, so the
// core file must really contain every glyph its range claims that the full file has. Read from the woff2 cmap, not the CSS.
import { cmapOf } from "./woff2-cmap";
const dir = join(__dirname, "../public/fonts");
const weights = (family: string, script: string) =>
  readdirSync(dir).filter((f) => f.startsWith(`${family}-${script}-core-`)).map((f) => [f, f.replace("-core-", "-")] as const);

describe("core font files hold every glyph their unicode-range claims", () => {
  const cases = [...weights("alexandria", "arabic"), ...weights("alexandria", "latin"), ...weights("outfit", "latin"), ...weights("jetbrains-mono", "latin")];
  it("finds the core files", () => expect(cases.length).toBe(12));
  it.each(cases)("%s covers the full file within its range", (core, full) => {
    const inRange = rangeOf(core.replace(".woff2", ""));
    const have = cmapOf(join(dir, core));
    expect(have.has(core.includes("arabic") ? 0x627 : 0x41), "cmap parsed").toBe(true);
    const missing = [...cmapOf(join(dir, full))].filter((c) => inRange(c) && !have.has(c));
    expect(missing.map((c) => c.toString(16))).toEqual([]);
  });
});
