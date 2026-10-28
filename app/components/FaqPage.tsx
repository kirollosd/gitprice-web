import { t, type Locale } from "../../lib/i18n";
import styles from "./LegalPage.module.css";

const COUNT = 5;

/** The questions people ask before installing: one plain list, every answer open. Copy: web.faq.* and web.home.faq.*. */
export default function FaqPage({ locale }: { locale: Locale }) {
  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t(locale, "web.faq.title")}</h1>
      </header>
      <p className={styles.intro}>{t(locale, "web.faq.intro")}</p>
      <article className={styles.article} style={{ marginBlockStart: "var(--gp-sp-8)" }}>
        {Array.from({ length: COUNT }, (_, i) => (
          <section key={i} className={styles.section} aria-labelledby={`faq-${i + 1}`}>
            <h2 id={`faq-${i + 1}`} className={styles.sectionTitle}>{t(locale, `web.home.faq.${i + 1}.q`)}</h2>
            <p className={styles.body}>{t(locale, `web.home.faq.${i + 1}.a`)}</p>
          </section>
        ))}
      </article>
    </div>
  );
}
