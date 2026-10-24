import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";
import { INDEXABLE_PATHS, NOINDEX_PATHS, pageMeta } from "../lib/seo";
import sitemap from "../app/sitemap";
import robots from "../app/robots";
import { sectionKeys } from "../app/components/LegalPage";

const SITE = "http://localhost:3000";

describe("pageMeta", () => {
  it("builds canonical and hreflang for ar /privacy", () => {
    const m = pageMeta("ar", "/privacy");
    expect(m.alternates?.canonical).toBe(`${SITE}/ar/privacy`);
    expect(m.alternates?.languages).toEqual({
      en: `${SITE}/privacy`,
      ar: `${SITE}/ar/privacy`,
      "x-default": `${SITE}/privacy`,
    });
    expect(m.robots).toBeUndefined();
  });
  it("uses the bare locale root for the home page", () => {
    expect(pageMeta("ar", "/").alternates?.canonical).toBe(`${SITE}/ar`);
    expect(pageMeta("en", "/").alternates?.canonical).toBe(`${SITE}/`);
  });
  it("sets noindex when asked", () => {
    expect(pageMeta("en", "/welcome", { noindex: true }).robots).toEqual({ index: false, follow: false });
  });
});

describe("sitemap and robots", () => {
  it("lists indexable pages in both locales and no noindex path", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toHaveLength(INDEXABLE_PATHS.length * 2);
    expect(urls).toContain(`${SITE}/ar/terms`);
    expect(urls).toContain(`${SITE}/sellers`);
    for (const p of NOINDEX_PATHS) {
      expect(urls.some((u) => u.replace(SITE, "").replace(/^\/ar(?=\/|$)/, "") === p)).toBe(false);
    }
  });
  it("robots allows all and points at the sitemap", () => {
    const r = robots();
    expect(r.rules).toEqual({ userAgent: "*", allow: "/" });
    expect(r.sitemap).toBe(`${SITE}/sitemap.xml`);
  });
});

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

describe("pricing is unlisted", () => {
  it("no file under app/ links to /pricing outside pricing/", () => {
    const offenders = files("app")
      .filter((f) => /\.(tsx?|css)$/.test(f) && !f.includes(`${join("[locale]", "pricing")}`))
      .filter((f) => /pricing/i.test(readFileSync(f, "utf8").replace(/web\.pricing\./g, "")));
    expect(offenders).toEqual([]);
  });
});

describe("legal pages render every key", () => {
  for (const name of ["privacy", "terms"] as const) {
    it(`${name}: sections and keys match in en and ar`, () => {
      const node = en.web[name] as Record<string, unknown>;
      const arNode = ar.web[name] as Record<string, unknown>;
      const secs = sectionKeys(name);
      expect(secs.length).toBe(name === "privacy" ? 9 : 11);
      for (const s of secs) {
        expect(Object.keys(arNode[s.id] as object)).toEqual(Object.keys(node[s.id] as object));
        expect(s.items.map((i) => i.key)).toEqual(Object.keys(node[s.id] as object).filter((k) => k !== "heading"));
      }
    });
  }
  it("privacy names Vercel, Tally and Heap", () => {
    const text = JSON.stringify(en.web.privacy);
    for (const n of ["Vercel", "Tally", "Heap"]) expect(text).toContain(n);
  });
});
