// GP-407 spacing rule: every spacing value on the website sits on the 8px scale.
// Scans app/**/*.css and the inline style props in app/**/*.tsx; `node scripts/spacing-grid.mjs` lists violations,
// tests/spacing-grid.test.ts fails on any that scripts/spacing-allowlist.json does not explain.
//
// Spacing properties: margin*, padding*, gap, row-gap, column-gap, inset*, top/right/bottom/left, scroll-margin*,
// scroll-padding*, translate and transform translate*(). Allowed px values:
//   0, 1px and 2px (hairlines, focus and underline offsets);
//   the scale only through its tokens, --gp-wsp-0 (4) and --gp-wsp-1,2,3,4,5,6,8,10,12,16 (8 x n: 8 … 128); 4 is the
//   icon-to-label micro gap): a literal 16px where a token exists is a finding too;
//   past 128, literal multiples of 8 (layout coordinates on the 8px grid; there is no token that large);
//   the same magnitudes negated (calc(-1 * var(--gp-wsp-1)) for the scale).
// The app/extension 4px tokens (--gp-sp-*) are not the website scale: any var(--gp-sp-N) in a spacing property is a
// finding. --gp-wsp-0 (4px) is allowed only on gap/column-gap/row-gap and margin-inline* (the icon-to-label gap).
// A custom property defined in the same file and used only by spacing properties (top: var(--dtop)) has its px checked
// too; one that also feeds a font-size or width (--fs) is a size.
// rem counts as 16px. em, %, vw/vh and var() are relative and not checked; var() fallbacks (var(--cw, 430px)) are sizes,
// not spacing. Custom properties (--x: …) are not checked where they are defined, only where a spacing property uses a literal.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export const SCALE = [8, 16, 24, 32, 40, 48, 64, 80, 96, 128];
const WSP = { 0: 4, 1: 8, 2: 16, 3: 24, 4: 32, 5: 40, 6: 48, 8: 64, 10: 80, 12: 96, 16: 128 };
const SPACING = /^(margin|padding|scroll-margin|scroll-padding)(-.+)?$|^(gap|row-gap|column-gap|inset(-.+)?|top|right|bottom|left|translate|transform)$/;
const JS_SPACING = /^(margin|padding|gap|rowGap|columnGap|inset|top|right|bottom|left|translate)/;

/** CSS literals: 0/1/2 and past-128 multiples of 8 only (the scale must come from its tokens). */
export function onGrid(px) {
  const v = Math.abs(px);
  if (v === 0 || v === 1 || v === 2) return true;
  return v > 128 && v % 8 === 0;
}
/** Inline style numbers (React has no tokens there): the grid itself. */
export function onGridJs(px) {
  const v = Math.abs(px);
  return onGrid(v) || SCALE.includes(v);
}

/** px magnitudes used as spacing in one declaration value (transform: only inside translate*()). */
function lengths(prop, value) {
  let v = value;
  // drop var() fallbacks, innermost first: var(--cw, 430px) is a size default, not a spacing literal
  for (let prev = ""; prev !== v;) { prev = v; v = v.replace(/var\((--[\w-]+)\s*,[^()]*\)/g, "var($1)"); }
  if (prop === "transform") v = [...value.matchAll(/translate(?:3d|X|Y|Z)?\(([^)]*)\)/g)].map((m) => m[1]).join(" ");
  const out = [];
  for (const m of v.matchAll(/(-?\d*\.?\d+)(px|rem)\b/g)) out.push({ raw: m[0], px: parseFloat(m[1]) * (m[2] === "rem" ? 16 : 1) });
  return out;
}

const MICRO_OK = /^(gap|row-gap|column-gap|margin-inline(-start|-end)?)$/;
/** token findings in one value: app-scale tokens anywhere, the micro token outside an icon-label gap */
function tokenFindings(prop, value) {
  const out = [];
  for (const m of value.matchAll(/var\(--gp-sp-\d+\)/g)) out.push(m[0]);
  if (!MICRO_OK.test(prop)) for (const m of value.matchAll(/var\(--gp-wsp-0\)/g)) out.push(m[0]);
  // a token sum must land on the scale too: calc(var(--gp-wsp-8) + var(--gp-wsp-1)) is 72
  for (const m of value.matchAll(/calc\(\s*var\(--gp-wsp-(\d+)\)\s*([+-])\s*var\(--gp-wsp-(\d+)\)\s*\)/g)) {
    const px = Math.abs(WSP[m[1]] + (m[2] === "+" ? 1 : -1) * WSP[m[3]]);
    if (!onGridJs(px)) out.push(m[0]);
  }
  return out;
}

const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));

export function scanCss(file, css) {
  const found = [];
  const src = strip(css);
  // declarations: prop: value; (inside rules; @media conditions have no `prop:` at depth > 0 that we care about)
  const re = /(^|[{;\s])(-?-?[a-z][a-z0-9-]*)\s*:\s*([^;{}]+)(?=[;}])/g;
  const defs = [], used = new Set(), sized = new Set();
  for (const m of src.matchAll(re)) {
    const prop = m[2], value = m[3].trim();
    if (prop.startsWith("--")) { defs.push({ prop, value, at: m.index + m[1].length }); continue; }
    if (!SPACING.test(prop)) { for (const v of value.matchAll(/var\((--[\w-]+)/g)) sized.add(v[1]); continue; }
    for (const v of value.matchAll(/var\((--[\w-]+)/g)) used.add(v[1]);
    const at = m.index + m[1].length;
    // skip media/container query conditions like (max-width: 767px) — those are inside parentheses after @media
    const before = src.slice(Math.max(0, at - 1), at);
    if (before === "(") continue;
    const line = src.slice(0, at).split("\n").length;
    for (const l of lengths(prop, value)) {
      if (!onGrid(l.px)) found.push({ file, line, prop, value: l.raw, decl: `${prop}: ${value}` });
    }
    for (const t of tokenFindings(prop, value)) found.push({ file, line, prop, value: t, decl: `${prop}: ${value}` });
  }
  for (const d of defs) {
    if (!used.has(d.prop) || sized.has(d.prop)) continue; // also a font-size/width: a size, not a spacer
    const line = src.slice(0, d.at).split("\n").length;
    for (const l of lengths(d.prop, d.value)) {
      if (!onGrid(l.px)) found.push({ file, line, prop: d.prop, value: l.raw, decl: `${d.prop}: ${d.value}` });
    }
    for (const t of tokenFindings("custom", d.value)) found.push({ file, line, prop: d.prop, value: t, decl: `${d.prop}: ${d.value}` });
  }
  return found;
}

export function scanTsx(file, tsx) {
  const found = [];
  for (const m of tsx.matchAll(/style=\{\{([\s\S]*?)\}\}/g)) {
    for (const d of m[1].matchAll(/([a-zA-Z]+)\s*:\s*([^,]+)/g)) {
      const prop = d[1], value = d[2].trim();
      if (!JS_SPACING.test(prop)) continue;
      const line = tsx.slice(0, m.index).split("\n").length;
      const nums = [...value.matchAll(/(?<![\w.$-])(-?\d*\.?\d+)(px)?\b(?![%\w])/g)].map((n) => ({ raw: n[0], px: parseFloat(n[1]) }));
      // only plain numbers or px literals: `34`, `"8px"`; expressions like `26 + cy(th) - 34` are checked term by term
      for (const n of nums) if (!onGridJs(n.px)) found.push({ file, line, prop, value: n.raw, decl: `${prop}: ${value}` });
      for (const t of tokenFindings(prop.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()), value)) found.push({ file, line, prop, value: t, decl: `${prop}: ${value}` });
    }
  }
  return found;
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

export function scan(root) {
  const found = [];
  for (const p of walk(join(root, "app"))) {
    const rel = relative(root, p);
    if (p.endsWith(".css")) found.push(...scanCss(rel, readFileSync(p, "utf8")));
    else if (p.endsWith(".tsx")) found.push(...scanTsx(rel, readFileSync(p, "utf8")));
  }
  return found;
}

/** Allowlist entries ({file, prop, value, reason}) that match a finding remove it; returns the rest and unused entries. */
export function applyAllowlist(found, allow) {
  const used = new Set();
  const rest = found.filter((f) => {
    const i = allow.findIndex((a) => a.file === f.file && a.prop === f.prop && a.value === f.value);
    if (i < 0) return true;
    used.add(i);
    return false;
  });
  return { rest, unused: allow.filter((_, i) => !used.has(i)) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.cwd();
  const found = scan(root);
  const allow = JSON.parse(readFileSync(join(root, "scripts/spacing-allowlist.json"), "utf8")).entries;
  const { rest } = applyAllowlist(found, allow);
  const byFile = {};
  for (const f of rest) (byFile[f.file] ??= []).push(f);
  for (const [file, list] of Object.entries(byFile)) {
    console.log(`${file} (${list.length})`);
    for (const f of list) console.log(`  ${f.line}: ${f.decl}  [${f.value}]`);
  }
  console.log(`total off-grid: ${found.length}, allowlisted: ${found.length - rest.length}, failing: ${rest.length}`);
  process.exitCode = rest.length ? 1 : 0;
}
