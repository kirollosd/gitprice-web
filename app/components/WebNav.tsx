"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t, type Locale } from "../../lib/i18n";
import { hasMinimalNav, localeFromPath, pathFor } from "../../lib/locale";
import { JoinButton } from "../landing/Dock";
import LangMenu from "../landing/LangMenu";
import Wordmark from "../landing/Wordmark";
import LanguageSwitch from "./LanguageSwitch";
import BetaTag from "./BetaTag";
import Logo from "./Logo";
import { NavCta, NavSellers } from "./NavLinks";
import ThemeToggle from "./ThemeToggle";
import { useActiveSection } from "./useActiveSection";
import styles from "./WebNav.module.css";
import site from "./WebNavSite.module.css";
import WebMenu from "./WebMenu";

const N = "web.component.webNav.";
const L = "web.landing.nav.";
/** The landing's sections, in page order. */
const LINKS = [["how", "howItWorks"], ["film", "watchLive"], ["spot", "matchChallenge"], ["rcpt", "savings"], ["rail", "stores"]] as const;
const IDS = LINKS.map(([id]) => id);

/**
 * Landing nav (home only), ported from combo.html: the board wordmark, the five landing links (>= 1024), the language menu, the
 * theme toggle and the always-visible CTA (on home it opens the dock's waitlist; elsewhere it links there). Over
 * a dark band the Dock sets header[data-dk]. The hosted variant is the logo (linking to the launched site root)
 * and the language switch.
 */
export default function WebNav({ locale, variant }: { locale: Locale; variant?: "landing" | "site" | "hosted" }) {
  const { rest } = localeFromPath(usePathname() ?? "/");
  const kind = variant ?? (hasMinimalNav(rest) ? "hosted" : rest === "/" ? "landing" : "site");
  const active = useActiveSection(IDS);
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
    // the landing's bar in flow: its five section links reach the landing; the phone keeps the menu sheet
    return (
      <header className={`${styles.header} ${styles.site} ${styles.top} ${styles.page} ${site.hdr}`}>
        <div className={styles.bar}>
          <Wordmark locale={locale} className={styles.brand} />
          <nav aria-label={t(locale, N + "a11y.label.primary")} className={styles.links}>
            {LINKS.map(([id, k]) => (
              <Link key={id} href={`${home}#${id}`} className={styles.link} data-gp-track="cta_click" data-gp-cta-id={`nav_${id}`} data-gp-placement="nav">{t(locale, L + k)}</Link>
            ))}
            <NavSellers locale={locale} keys="1024" className={`${styles.link} ${styles.sellers} ${styles.sellersShort}`} />
            <NavSellers locale={locale} keys="1440" className={`${styles.link} ${styles.sellers} ${styles.sellersLong}`} />
          </nav>
          <div className={styles.actions}>
            <NavSellers locale={locale} keys="768" className={`${styles.link} ${styles.sellers} ${site.l768}`} />
            <span className={site.wide}><LangMenu locale={locale} /></span>
            <span className={site.wide}><ThemeToggle locale={locale} /></span>
            <NavCta locale={locale} keys="1440" className={`${styles.cta} ${site.hideSmall}`} />
            <WebMenu locale={locale} />
          </div>
        </div>
      </header>
    );
  }
  return (
    <header className={`${styles.header} ${styles.site} ${styles.top} ${styles.landing}`}>
      <div className={styles.bar}>
        <Wordmark locale={locale} className={styles.brand} />
        <nav aria-label={t(locale, N + "a11y.label.primary")} className={styles.links}>
          {LINKS.map(([id, k]) => (
            <Link key={id} href={`${home}#${id}`} className={styles.link} aria-current={active === id ? "true" : undefined} data-gp-track="cta_click" data-gp-cta-id={`nav_${id}`} data-gp-placement="nav">{t(locale, L + k)}</Link>
          ))}
          <NavSellers locale={locale} keys="1024" className={`${styles.link} ${styles.sellers} ${styles.sellersShort}`} />
          <NavSellers locale={locale} keys="1440" className={`${styles.link} ${styles.sellers} ${styles.sellersLong}`} />
        </nav>
        <div className={styles.actions}>
          <LangMenu locale={locale} />
          <ThemeToggle locale={locale} />
          {rest === "/" ? (
            <span className={styles.ctaWrap}>
              {/* the hero CTA (and its tag) is hidden on phones, so the tag moves here, as a corner badge so the bar keeps its width; CSS shows exactly one. Before the button in the DOM, as on screen */}
              <BetaTag locale={locale} className={styles.navBeta} />
              <JoinButton locale={locale} placement="nav" className={styles.cta} />
            </span>
          ) : <NavCta locale={locale} keys="1440" className={styles.cta} />}
        </div>
      </div>
    </header>
  );
}
