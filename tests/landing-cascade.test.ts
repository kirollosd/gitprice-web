import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("app/landing/base.module.css", "utf8");

describe("landing base resets", () => {
  // `.canvas :where(p)` is (0,1,0), the same as a component class, and base loads last, so it beat Hero's h1/cap/lede line-heights and muted colours
  it("keep specificity at element level so component rules win", () => {
    const resets = css.split("\n").filter((l) => /^\S.*\{[^}]*(line-height|color): inherit|^\S.*\{[^}]*line-height: normal/.test(l) && /\b(h1|p)\b/.test(l));
    expect(resets.length).toBeGreaterThan(1);
    for (const l of resets) expect(l.startsWith(":where(.canvas)")).toBe(true);
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
