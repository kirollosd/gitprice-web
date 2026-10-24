import Link from "next/link";
import { t, type Locale } from "../../lib/i18n";
import { pathFor } from "../../lib/locale";
import { CookieSettingsButton } from "./CookieNotice";
import styles from "./WebFooter.module.css";

const K = "web.component.webFooter.default.";

/** Hosted pages keep only the privacy link and the cookie settings control. */
export default function HostedFooter({ locale }: { locale: Locale }) {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.inner} container`}>
        <nav aria-label={t(locale, K + "label.nav")}>
          <ul className={styles.links} role="list">
            <li><Link href={pathFor(locale, "/privacy")} className={styles.link}>{t(locale, K + "label.privacy")}</Link></li>
            <li><CookieSettingsButton locale={locale} className={styles.link} /></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
