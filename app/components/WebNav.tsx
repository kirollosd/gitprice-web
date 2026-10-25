"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t, type Locale } from "../../lib/i18n";
import { hasMinimalNav, localeFromPath, pathFor } from "../../lib/locale";
import LanguageSwitch from "./LanguageSwitch";
import Logo from "./Logo";
import { NavCta, NavSellers } from "./NavLinks";
import WebMenu from "./WebMenu";
import styles from "./WebNav.module.css";

const N = "web.component.webNav.";

/**
 * Site nav. >=1280 uses the 1440 labels, 1024-1279 the 1024 labels, 768-1023 sellers + CTA + menu,
 * below 768 logo + menu. The hosted variant is the logo (linking to the launched site root) and the language switch.
 */
export default function WebNav({ locale, variant }: { locale: Locale; variant?: "site" | "hosted" }) {
  const hostedPath = hasMinimalNav(localeFromPath(usePathname()).rest);
  if ((variant ?? (hostedPath ? "hosted" : "site")) === "hosted") {
    return (
      <header className={styles.header}>
        <div className={`${styles.bar} container`}>
          <Logo locale={locale} href="/" />
          <LanguageSwitch locale={locale} />
        </div>
      </header>
    );
  }
  const home = pathFor(locale, "/");
  return (
    <header className={styles.header}>
      <div className={`${styles.bar} container`}>
        <Logo locale={locale} />
        <nav aria-label={t(locale, N + "a11y.label.primary")} className={styles.links}>
          <Link href={`${home}#features`} className={`${styles.link} ${styles.wide}`} data-gp-track="cta_click" data-gp-cta-id="features" data-gp-placement="nav">{t(locale, N + "1024.label.features")}</Link>
          <Link href={`${home}#how-it-works`} className={`${styles.link} ${styles.wide}`} data-gp-track="cta_click" data-gp-cta-id="how_it_works" data-gp-placement="nav">{t(locale, N + "1024.label.howItWorks")}</Link>
          <NavSellers locale={locale} keys="1024" className={`${styles.link} ${styles.sellers} ${styles.l1024}`} />
          <NavSellers locale={locale} keys="1440" className={`${styles.link} ${styles.sellers} ${styles.l1440}`} />
          <NavSellers locale={locale} keys="768" className={`${styles.link} ${styles.sellers} ${styles.l768}`} />
        </nav>
        <div className={styles.actions}>
          <span className={styles.wide}><LanguageSwitch locale={locale} /></span>
          <NavCta locale={locale} keys="1440" className={`${styles.cta} ${styles.hideSmall}`} />
          <WebMenu locale={locale} />
        </div>
      </div>
    </header>
  );
}
