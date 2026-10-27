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

describe("phone text floor", () => {
  // the phone canvas is zoomed by z < 1 under 430px, so small px sizes render under 12px; --fl = 12px / z lifts them
  it("lp-m rules never set a bare px size of 14 or less", async () => {
    const { readdirSync } = await import("node:fs");
    const bare = /(font-size: |font: (?:\d+ )?)(\d+(?:\.\d+)?)px/;
    for (const f of readdirSync("app/landing").filter((n) => n.endsWith(".css"))) {
      for (const line of readFileSync(`app/landing/${f}`, "utf8").split("\n")) {
        const m = line.includes("lp-m") && bare.exec(line);
        if (m && /^(1[0-4]|[0-9])(\.\d+)?$/.test(m[2]) && !/\.eq\b|\.why \.eq/.test(line)) throw new Error(`${f}: ${line.trim().slice(0, 90)}`);
      }
    }
    expect(readFileSync("app/landing/base.module.css", "utf8")).toMatch(/lp-m\) \.canvas \{ --fl: calc\(12px \/ var\(--z/);
  });
});
