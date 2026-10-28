import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { describe, expect, it } from "vitest";
import { INDEXABLE_PATHS, NOINDEX_PATHS, pageMeta } from "../lib/seo";
import sitemap from "../app/sitemap";
import robots from "../app/robots";
import LegalPage from "../app/components/LegalPage";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { t } from "../lib/i18n";

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
    expect(pageMeta("en", "/").alternates?.canonical).toBe(SITE);
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
    expect(sitemap()[0].alternates?.languages).toHaveProperty("x-default", SITE);
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

const linksToPricing = (src: string) =>
  /href\s*=[^>]*\/pricing/.test(src) || /pathFor\([^)]*["']\/pricing/.test(src);

describe("pricing is unlisted", () => {
  it("no file under app/ links to /pricing outside pricing/", () => {
    const offenders = files("app")
      .filter((f) => /\.tsx?$/.test(f) && !f.includes(join("[locale]", "pricing")))
      .filter((f) => linksToPricing(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});

describe("legal pages", () => {
  const decode = (h: string) =>
    h.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const must = [
    ["privacy", "section3.p3"],
    ["privacy", "section7.p2"],
    ["privacy", "section7.p3"],
    ["terms", "section11.p1"],
  ] as const;
  for (const locale of ["en", "ar"] as const) {
    for (const name of ["privacy", "terms"] as const) {
      it(`${locale} ${name}: no doubled bullets, key paragraphs present`, () => {
        const html = renderToStaticMarkup(createElement(LegalPage, { locale, name }));
        const items = [...html.matchAll(/<li>([^<]*)<\/li>/g)].map((m) => decode(m[1]));
        expect(items.length).toBeGreaterThan(0);
        for (const text of items) expect(text).not.toMatch(/^[\u200e\u200f]*•/u);
        const text = decode(html);
        for (const [n, key] of must) if (n === name) expect(text).toContain(t(locale, `web.${n}.${key}`));
      });
    }
  }
  it("TOC label is not a heading, so the h1 comes first", () => {
    const html = renderToStaticMarkup(createElement(LegalPage, { locale: "en", name: "privacy" }));
    expect(html.indexOf("<h1")).toBeLessThan(html.indexOf("<h2"));
    expect(html).toMatch(/<nav[^>]*aria-label=/);
  });
});

describe("pricing link detector", () => {
  it("flags real links and ignores prose", () => {
    expect(linksToPricing('<a href="/pricing">x</a>')).toBe(true);
    expect(linksToPricing('<Link href={pathFor(locale, "/pricing")}>')).toBe(true);
    expect(linksToPricing('href={`${base}/ar/pricing`}')).toBe(true);
    expect(linksToPricing("/* the pricing page */ const a = 'web.pricing.x'")).toBe(false);
  });
});

describe("per-page share metadata", () => {
  const meta = async (mod: Promise<{ generateMetadata: (p: { params: Promise<{ locale: "en" | "ar" }> }) => Promise<Metadata> }>, locale: "en" | "ar" = "en") =>
    (await mod).generateMetadata({ params: Promise.resolve({ locale }) });

  it("Home titles itself with the hero headline and shares the hero sub", async () => {
    for (const locale of ["en", "ar"] as const) {
      const m = await meta(import("../app/[locale]/page"), locale);
      const full = `${t(locale, "web.landing.hero.headline")} | GitPrice`;
      expect(m.title).toEqual({ absolute: full });
      expect(m.openGraph).toMatchObject({ title: full, description: t(locale, "web.landing.hero.lede"), locale: locale === "en" ? "en_US" : "ar_AR" });
      expect(m.twitter).toMatchObject({ title: full, description: t(locale, "web.landing.hero.lede") });
    }
  });

  it("Sellers shares the seller pitch, not the shopper one", async () => {
    const m = await meta(import("../app/[locale]/sellers/page"));
    const full = `${t("en", "web.sellers.hero.headline")} | GitPrice`;
    expect(m.openGraph).toMatchObject({ title: full, description: t("en", "web.sellers.hero.sub"), url: `${SITE}/sellers` });
    expect(m.twitter).toMatchObject({ title: full, description: t("en", "web.sellers.hero.sub") });
  });

  it("every page's share card matches its own title and description", async () => {
    const pages = [
      [import("../app/[locale]/welcome/page"), "web.welcome.title", "web.welcome.subtitle"],
      [import("../app/[locale]/pricing/page"), "web.pricing.noPrices.title", "web.pricing.noPrices.subtitle"],
      [import("../app/[locale]/privacy/page"), "web.privacy.title", "web.privacy.intro"],
      [import("../app/[locale]/terms/page"), "web.terms.title", "web.terms.intro"],
    ] as const;
    for (const [mod, title, description] of pages) {
      const m = await meta(mod as never, "ar");
      const full = `${t("ar", title)} | GitPrice`;
      expect(m.title, title).toEqual({ absolute: full });
      expect(m.description).toBe(t("ar", description));
      expect(m.openGraph, title).toMatchObject({ title: full, description: t("ar", description), alternateLocale: "en_US" });
      expect(m.twitter, title).toMatchObject({ card: "summary_large_image", title: full, description: t("ar", description) });
    }
  });

  it("every page carries the locale's generated share image in og:image and twitter:image", async () => {
    const pages = ["page", "sellers/page", "welcome/page", "pricing/page", "faq/page", "privacy/page", "terms/page"];
    for (const locale of ["en", "ar"] as const) {
      const image = { url: `${SITE}/${locale}/opengraph-image`, width: 1200, height: 630, type: "image/png", alt: "GitPrice" };
      for (const p of pages) {
        const m = await meta(import(`../app/[locale]/${p}`), locale);
        expect((m.openGraph as { images?: unknown }).images, `${locale} ${p}`).toEqual([image]);
        expect((m.twitter as { images?: unknown }).images, `${locale} ${p}`).toEqual([image]);
      }
    }
  });

  it("never points at the legacy OG asset", () => {
    for (const f of files("app").filter((f) => /\.tsx?$/.test(f))) expect(readFileSync(f, "utf8"), f).not.toContain("logo_og.png");
  });
});
