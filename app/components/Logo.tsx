import Link from "next/link";
import { t, type Locale } from "../../lib/i18n";
import styles from "./Logo.module.css";

interface LogoProps {
  locale: Locale;
  /** Defaults to the locale home; the hosted nav passes "/" (the launched site). */
  href?: string;
  className?: string;
}

/** GitPrice mark and wordmark, drawn with design tokens. */
export default function Logo({ locale, href, className }: LogoProps) {
  return (
    <Link
      href={href ?? (locale === "ar" ? "/ar" : "/")}
      className={`${styles.root} ${className ?? ""}`}
      aria-label={t(locale, "web.component.webNav.a11y.label.home")}
    >
      <svg className={styles.icon} width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="7" className={styles.tile} />
        <text x="5.5" y="24" fontSize="21" fontWeight="800" className={styles.glyph}>G</text>
      </svg>
      <span className={styles.wordmark} dir="ltr">GitPrice</span>
    </Link>
  );
}
