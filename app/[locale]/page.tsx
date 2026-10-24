import { t } from "../../lib/i18n";

export default async function HomePage({ params }: { params: Promise<{ locale: "en" | "ar" }> }) {
  const { locale } = await params;
  return (
    <section className="container" style={{ paddingBlock: "var(--gp-sp-16)" }}>
      <h1 style={{ fontSize: "var(--gp-fs-display)", lineHeight: "var(--gp-lh-display)" }}>
        {t(locale, "web.home.hero.headline")}
      </h1>
      <p style={{ marginBlockStart: "var(--gp-sp-4)" }}>{t(locale, "web.home.hero.sub")}</p>
    </section>
  );
}
