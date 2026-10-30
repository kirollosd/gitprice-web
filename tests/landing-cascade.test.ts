import { readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import postcss, { type Rule } from "postcss";
import { describe, expect, it } from "vitest";

const css = readFileSync("app/landing/base.module.css", "utf8");

const rules = (src: string) => { const out: Rule[] = []; postcss.parse(src).walkRules((r) => { out.push(r); }); return out; };
const decls = (r: Rule, prop: RegExp) => { const d: { prop: string; value: string }[] = []; r.walkDecls(prop, (x) => { d.push(x); }); return d; };

describe("landing base resets", () => {
  // `.canvas :where(p)` is (0,1,0), the same as a component class, and base loads last, so it beat Hero's h1/cap/lede line-heights and muted colours
  it("keep specificity at element level so component rules win", () => {
    const resets = rules(css).filter((r) => /\b(h1|p)\b/.test(r.selector)
      && decls(r, /^(line-height|color)$/).some((d) => d.value === "inherit" || d.value === "normal"));
    expect(resets.length).toBeGreaterThan(1);
    for (const r of resets) for (const sel of r.selectors) expect(sel.startsWith(":where(.canvas)"), sel).toBe(true);
  });
  it("resets canvas headings to the browser's bold, as the mock does", () => {
    expect(css).toMatch(/:where\(\.canvas\) :is\(h1[^{]*\{[^}]*font-weight: bold/);
  });
});

describe("film frame", () => {
  // the poster vars are set late by DemoVideo; an unset var inside the `background` shorthand drops the whole declaration, slab included
  it("keeps the slab backdrop when no poster var is set yet", () => {
    const film = readFileSync("app/landing/Film.module.css", "utf8");
    expect(film).not.toMatch(/background:[^;]*var\(--p[lmd]+\)/);
    expect(film).not.toMatch(/background-image: var\(--p[lmd]+\);/);
  });
});

describe("phone text floor", () => {
  // the phone canvas is zoomed by z < 1 under 430px, so small px sizes render under 12px; --fl = 12px / z lifts them
  const bare = /(?:^|\s)(\d+(?:\.\d+)?)px\b/;
  // the mark's own glyph box, not text
  const EXEMPT = new Set([".eq", ".why .eq"]);
  it("lp-m rules never set a bare px size of 14 or less (multi-line rules included)", () => {
    for (const f of readdirSync("app/landing").filter((n) => n.endsWith(".css"))) {
      for (const r of rules(readFileSync(`app/landing/${f}`, "utf8"))) {
        const phone = r.selectors.filter((sel) => sel.includes("lp-m") && !EXEMPT.has(sel.replace(/^:global\(html\.lp-m\) /, "")));
        if (!phone.length) continue;
        for (const d of decls(r, /^font(-size)?$/)) {
          const value = d.value.replace(/max\([^)]*\)/g, ""); // max(Npx, var(--fl)) is the floor itself
          const m = bare.exec(value);
          expect(m && +m[1] <= 14, `${f}: ${phone[0]} { ${d.prop}: ${d.value} }`).toBeFalsy();
        }
      }
    }
    expect(css).toMatch(/lp-m\) \.canvas \{ --fl: calc\(12px \/ var\(--z/);
  });
  it("the scan sees multi-line rules", () => {
    const [r] = rules(":global(html.lp-m) .x {\n  font-size: 11px;\n}");
    expect(decls(r, /^font(-size)?$/)[0].value).toBe("11px");
  });
});

describe("Arabic type parity with the mock", () => {
  // the mock excludes only the .dg/.digits/.word element itself from the no-tracking rule, so the cells' children read normal
  it("the no-tracking rule exempts the keep-ls element only, not its subtree", () => {
    expect(css).toMatch(/\*:not\(\[data-keep-ls\]\) \{ letter-spacing: normal !important/);
    expect(css).not.toMatch(/:not\(\[data-keep-ls\] \*\)/);
  });
  it("the Arabic button line-height has zero specificity so chip `font:` shorthands reset it like the mock", () => {
    expect(css).toMatch(/:where\(:global\(html\[lang="ar"\]\) \.canvas button\) \{ line-height: 1\.25; \}/);
  });
  it("the footer word beats .mono's weight", () => {
    expect(readFileSync("app/landing/Foot.module.css", "utf8")).toMatch(/^\.foot \.word \{[^}]*font-weight: 300/m);
  });
  it("the phone header Beta tag renders at the 13px caption floor after the landing zoom", () => {
    const nav = readFileSync("app/components/WebNav.module.css", "utf8");
    expect(nav).not.toMatch(/\.mark \[data-beta\][^}]*font-size: 10px/);
    expect(nav).toMatch(/\.mark \[data-beta\] \{[^}]*font-size: max\(13px, calc\(13px \/ var\(--z, 1\)\)\)/);
  });
});
