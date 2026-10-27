"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t, type Locale } from "../../lib/i18n";
import { hasMinimalNav, localeFromPath, pathFor } from "../../lib/locale";
import { JoinButton } from "../landing/Dock";
import LangMenu from "../landing/LangMenu";
import Wordmark from "../landing/Wordmark";
import LanguageSwitch from "./LanguageSwitch";
import Logo from "./Logo";
import { NavCta, NavSellers } from "./NavLinks";
import ThemeToggle from "./ThemeToggle";
import styles from "./WebNav.module.css";

const N = "web.component.webNav.";
const L = "web.landing.nav.";
/** The landing's sections, in page order. */
const LINKS = [["how", "howItWorks"], ["film", "watchLive"], ["spot", "matchChallenge"], ["rcpt", "savings"], ["rail", "stores"]] as const;

/**
 * Site nav, ported from combo.html: the board wordmark, the five landing links (>= 1024), the language menu, the
 * theme toggle and the always-visible CTA (on home it opens the dock's waitlist; elsewhere it links there). Over
 * a dark band the Dock sets header[data-dk]. The hosted variant is the logo (linking to the launched site root)
 * and the language switch.
 */
export default function WebNav({ locale, variant }: { locale: Locale; variant?: "site" | "hosted" }) {
  const { rest } = localeFromPath(usePathname() ?? "/");
  if ((variant ?? (hasMinimalNav(rest) ? "hosted" : "site")) === "hosted") {
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
    <header className={`${styles.header} ${styles.site}`}>
      <div className={styles.bar}>
        <Wordmark locale={locale} className={styles.brand} />
        <nav aria-label={t(locale, N + "a11y.label.primary")} className={styles.links}>
          {LINKS.map(([id, k]) => (
            <Link key={id} href={`${home}#${id}`} className={styles.link} data-gp-track="cta_click" data-gp-cta-id={`nav_${id}`} data-gp-placement="nav">{t(locale, L + k)}</Link>
          ))}
          <NavSellers locale={locale} keys="1440" className={`${styles.link} ${styles.sellers}`} />
        </nav>
        <div className={styles.actions}>
          <LangMenu locale={locale} />
          <ThemeToggle locale={locale} />
          {rest === "/" ? <JoinButton locale={locale} placement="nav" className={styles.cta} /> : <NavCta locale={locale} keys="1440" className={styles.cta} />}
        </div>
      </div>
    </header>
  );
}
