import Link from "next/link";
import { t, type Locale } from "../../lib/i18n";
import { pathFor } from "../../lib/locale";
import { CookieSettingsButton } from "./CookieNotice";
import LanguageSwitch from "./LanguageSwitch";
import FooterTagline from "./FooterTagline";
import BetaTag from "./BetaTag";
import Logo from "./Logo";
import styles from "./WebFooter.module.css";

const K = "web.component.webFooter.default.";

export default function WebFooter({ locale }: { locale: Locale }) {
  return (
    <footer className={styles.footer}>
      <div className="container">
       <div className={styles.inner}>
        <div className={styles.brand}>
          <Logo locale={locale} />
          <BetaTag locale={locale} />
          <FooterTagline locale={locale} className={styles.tagline} />
        </div>
        <nav aria-label={t(locale, K + "label.nav")}>
          <ul className={styles.links} role="list">
            <li><Link href={pathFor(locale, "/faq")} className={styles.link} data-gp-track="cta_click" data-gp-cta-id="faq" data-gp-placement="footer">{t(locale, K + "label.faq")}</Link></li>
            <li><Link href={pathFor(locale, "/privacy")} className={styles.link} data-gp-track="cta_click" data-gp-cta-id="privacy_policy" data-gp-placement="footer">{t(locale, K + "label.privacy")}</Link></li>
            <li><Link href={pathFor(locale, "/terms")} className={styles.link} data-gp-track="cta_click" data-gp-cta-id="terms" data-gp-placement="footer">{t(locale, K + "label.terms")}</Link></li>
            <li><LanguageSwitch locale={locale} icon /></li>
          </ul>
        </nav>
        <div className={styles.legal}>
          <p className={styles.copy}>{t(locale, K + "copyright")}</p>
          <CookieSettingsButton locale={locale} className={`${styles.cookie} hit-target`} />
        </div>
       </div>
      </div>
    </footer>
  );
}
