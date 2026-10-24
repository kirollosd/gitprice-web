import Link from "next/link";
import { t, type Locale } from "../../lib/i18n";
import { pathFor } from "../../lib/locale";
import LanguageSwitch from "./LanguageSwitch";
import Logo from "./Logo";
import WebMenu from "./WebMenu";
import styles from "./WebNav.module.css";

const N = "web.component.webNav.";

/**
 * Site nav. >=1280 uses the 1440 labels, 1024-1279 the 1024 labels, 768-1023 sellers + CTA + menu,
 * below 768 logo + menu. The hosted variant is a logo only, linking to the launched site root.
 */
export default function WebNav({ locale, variant = "site" }: { locale: Locale; variant?: "site" | "hosted" }) {
  if (variant === "hosted") {
    return (
      <header className={styles.header}>
        <div className={`${styles.bar} container`}>
          <Logo locale={locale} href="/" />
        </div>
      </header>
    );
  }
  const home = pathFor(locale, "/");
  const sellers = pathFor(locale, "/sellers");
  return (
    <header className={styles.header}>
      <div className={`${styles.bar} container`}>
        <Logo locale={locale} />
        <nav aria-label={t(locale, N + "a11y.label.primary")} className={styles.links}>
          <Link href={`${home}#features`} className={`${styles.link} ${styles.wide}`}>{t(locale, N + "1024.label.features")}</Link>
          <Link href={`${home}#how-it-works`} className={`${styles.link} ${styles.wide}`}>{t(locale, N + "1024.label.howItWorks")}</Link>
          <Link href={sellers} className={`${styles.link} ${styles.l1024}`}>{t(locale, N + "1024.label.sellers")}</Link>
          <Link href={sellers} className={`${styles.link} ${styles.l1440}`}>{t(locale, N + "1440.label.sellers")}</Link>
          <Link href={sellers} className={`${styles.link} ${styles.l768}`}>{t(locale, N + "768.label.sellers")}</Link>
        </nav>
        <div className={styles.actions}>
          <span className={styles.wide}><LanguageSwitch locale={locale} /></span>
          <Link href={`${home}#waitlist`} className={`${styles.cta} ${styles.hideSmall}`}>{t(locale, N + "1440.cta.label")}</Link>
          <WebMenu locale={locale} />
        </div>
      </div>
    </header>
  );
}
