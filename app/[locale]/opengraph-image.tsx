import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { t } from "../../lib/i18n";
import { OG_IMAGE } from "../../lib/seo";
import { tokenColor } from "../../lib/tokens";

// Kept equal to OG_IMAGE, which pageMeta puts in every page's og:image and twitter:image.
export const size = { width: OG_IMAGE.width, height: OG_IMAGE.height };
export const contentType = OG_IMAGE.type;
export const alt = OG_IMAGE.alt;
// Build-time only: the font and token files are read at build, never at request time on Vercel.
export const dynamic = "force-static";
export const generateStaticParams = () => [{ locale: "en" }, { locale: "ar" }];

const root = process.cwd();
// Satori reads woff but not woff2, so the font comes from the @fontsource package public/fonts was copied from.
const fustat700 = () => readFileSync(join(root, "node_modules/@fontsource/fustat/files/fustat-latin-700-normal.woff"));
const wordmark = () => "data:image/svg+xml;base64," + readFileSync(join(root, "public/logo_wordmark.svg")).toString("base64");

/**
 * Share card: wordmark, hero line and a jade rule on the light surface.
 * Arabic is a committed PNG of the same card from scripts/render-og-ar.mjs: Satori has no bidi or Arabic contextual
 * shaping (it throws on Noto Sans Arabic's GSUB and lays Arabic out left to right), so it would render broken.
 */
export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale === "ar") {
    return new Response(readFileSync(join(root, "app/[locale]/og-ar.png")), { headers: { "Content-Type": contentType } });
  }
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: 80,
          background: tokenColor("surface"),
          // Satori has no logical properties; the rule is physical-bottom in both locales.
          borderBottom: `16px solid ${tokenColor("accent")}`,
          fontFamily: "Fustat",
        }}
      >
        <img src={wordmark()} width={278} height={80} alt="" />
        <div style={{ display: "flex", color: tokenColor("ink"), fontSize: 72, fontWeight: 700, lineHeight: 1.15, maxWidth: 1040 }}>
          {t("en", "web.home.hero.headline")}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Fustat", data: fustat700(), weight: 700 }] },
  );
}
