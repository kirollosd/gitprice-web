import { t } from "../lib/i18n";

// Placeholder until Task 6 builds the real Home.
export default function HomePage() {
  return (
    <section className="container" style={{ paddingBlock: "var(--gp-sp-16)" }}>
      <h1 style={{ fontSize: "var(--gp-fs-display)", lineHeight: "var(--gp-lh-display)" }}>
        {t("en", "web.home.hero.headline")}
      </h1>
      <p style={{ marginBlockStart: "var(--gp-sp-4)" }}>{t("en", "web.home.hero.sub")}</p>
    </section>
  );
}
