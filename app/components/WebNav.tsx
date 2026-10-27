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
import site from "./WebNavSite.module.css";
import WebMenu from "./WebMenu";

const N = "web.component.webNav.";
const L = "web.landing.nav.";
/** The landing's sections, in page order. */
const LINKS = [["how", "howItWorks"], ["film", "watchLive"], ["spot", "matchChallenge"], ["rcpt", "savings"], ["rail", "stores"]] as const;

/**
 * Landing nav (home only), ported from combo.html: the board wordmark, the five landing links (>= 1024), the language menu, the
 * theme toggle and the always-visible CTA (on home it opens the dock's waitlist; elsewhere it links there). Over
 * a dark band the Dock sets header[data-dk]. The hosted variant is the logo (linking to the launched site root)
 * and the language switch.
 */
export default function WebNav({ locale, variant }: { locale: Locale; variant?: "landing" | "site" | "hosted" }) {
  const { rest } = localeFromPath(usePathname() ?? "/");
  const kind = variant ?? (hasMinimalNav(rest) ? "hosted" : rest === "/" ? "landing" : "site");
  if (kind === "hosted") {
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
  if (kind === "site") {
    // sellers, legal and the rest have no landing anchors: they keep the phone menu sheet
    return (
      <header className={`${styles.header} ${site.hdr}`}>
        <div className={`${styles.bar} container`}>
          <Logo locale={locale} />
          <nav aria-label={t(locale, N + "a11y.label.primary")} className={site.links}>
            <Link href={`${home}#features`} className={`${site.link} ${site.wide}`} data-gp-track="cta_click" data-gp-cta-id="features" data-gp-placement="nav">{t(locale, N + "1024.label.features")}</Link>
            <Link href={`${home}#how-it-works`} className={`${site.link} ${site.wide}`} data-gp-track="cta_click" data-gp-cta-id="how_it_works" data-gp-placement="nav">{t(locale, N + "1024.label.howItWorks")}</Link>
            <NavSellers locale={locale} keys="1024" className={`${site.link} ${site.sellers} ${site.l1024}`} />
            <NavSellers locale={locale} keys="1440" className={`${site.link} ${site.sellers} ${site.l1440}`} />
            <NavSellers locale={locale} keys="768" className={`${site.link} ${site.sellers} ${site.l768}`} />
          </nav>
          <div className={site.actions}>
            <span className={site.wide}><LanguageSwitch locale={locale} /></span>
            <NavCta locale={locale} keys="1440" className={`${site.cta} ${site.hideSmall}`} />
            <WebMenu locale={locale} />
          </div>
        </div>
      </header>
    );
  }
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
