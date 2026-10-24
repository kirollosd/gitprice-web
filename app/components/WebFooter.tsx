import Link from "next/link";
import { t, type Locale } from "../../lib/i18n";
import { pathFor } from "../../lib/locale";
import Logo from "./Logo";
import styles from "./WebFooter.module.css";

const K = "web.component.webFooter.default.";

export default function WebFooter({ locale }: { locale: Locale }) {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.inner} container`}>
        <div className={styles.brand}>
          <Logo locale={locale} />
          <p className={styles.tagline}>{t(locale, K + "tagline")}</p>
        </div>
        <nav aria-label={t(locale, K + "label.nav")}>
          <ul className={styles.links} role="list">
            <li><Link href={pathFor(locale, "/privacy")} className={styles.link}>{t(locale, K + "label.privacy")}</Link></li>
            <li><Link href={pathFor(locale, "/terms")} className={styles.link}>{t(locale, K + "label.terms")}</Link></li>
          </ul>
        </nav>
        <p className={styles.copy}>{t(locale, K + "copyright")}</p>
      </div>
    </footer>
  );
}
