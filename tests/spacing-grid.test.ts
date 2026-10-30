// GP-407 spacing rule, enforced: every spacing value in app/**/*.css and the inline style props of app/**/*.tsx sits on
// the website's 8px scale (scripts/spacing-grid.mjs). An exception lives in scripts/spacing-allowlist.json with a reason.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { applyAllowlist, scan, scanCss, scanTsx } from "../scripts/spacing-grid.mjs";

type Finding = { file: string; line: number; prop: string; value: string; decl: string };
type Entry = { file: string; prop: string; value: string; reason?: string };
const root = join(__dirname, "..");
const allow: Entry[] = JSON.parse(readFileSync(join(root, "scripts/spacing-allowlist.json"), "utf8")).entries;

describe("website spacing grid", () => {
  const found: Finding[] = scan(root);
  const { rest, unused } = applyAllowlist(found, allow);

  it("has no off-grid spacing outside the allowlist", () => {
    const byFile: Record<string, string[]> = {};
    for (const f of rest) (byFile[f.file] ??= []).push(`${f.line}: ${f.decl} [${f.value}]`);
    expect(byFile).toEqual({});
  });

  it("gives every allowlist entry a reason, and drops entries that no longer match", () => {
    expect(allow.filter((a) => !a.reason?.trim())).toEqual([]);
    expect(unused).toEqual([]);
  });

  it("flags what the rule forbids", () => {
    const v = (css: string) => scanCss("x.css", css).map((f: Finding) => f.value);
    expect(v(".a { padding: 10px 16px; }")).toEqual(["10px", "16px"]); // off-grid, and a scale literal without its token
    expect(v(".a { gap: var(--gp-sp-3); margin: calc(var(--gp-wsp-8) + var(--gp-wsp-1)) 0; }")).toEqual([
      "var(--gp-sp-3)",
      "calc(var(--gp-wsp-8) + var(--gp-wsp-1))",
    ]);
    expect(v(".a { padding: var(--gp-wsp-0); }")).toEqual(["var(--gp-wsp-0)"]); // the 4px token is for icon-label gaps only
    expect(v(".a { --d: 290px; } .b { top: var(--d); }")).toEqual(["290px"]);
    expect(v(".a { transform: translateY(6px) rotate(45deg); }")).toEqual(["6px"]);
    expect(scanTsx("x.tsx", '<i style={{ left: 34, padding: "4px 8px" }} />').map((f: Finding) => f.value)).toEqual(["34", "4px"]);
  });

  it("allows the scale tokens, hairlines, sizes and large grid coordinates", () => {
    const css = `.a { gap: var(--gp-wsp-0); padding: var(--gp-wsp-3) var(--gp-wsec); margin: 0 1px 2px; top: 144px;
      width: 430px; min-block-size: 44px; font-size: 13px; border-radius: 6px; inset: calc(-1 * var(--gp-wsp-1)); left: var(--cw, 430px); }
      @media (max-width: 767px) { .b { padding-inline: var(--gp-wsp-2); } }`;
    expect(scanCss("x.css", css)).toEqual([]);
  });
});
