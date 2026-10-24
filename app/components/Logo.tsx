import Link from "next/link";
import { t, type Locale } from "../../lib/i18n";
import styles from "./Logo.module.css";

interface LogoProps {
  locale: Locale;
  /** Defaults to the locale home; the hosted nav passes "/" (the launched site). */
  href?: string;
  className?: string;
}

/** GitPrice wordmark: navy on light, white on dark (brand rule). */
export default function Logo({ locale, href, className }: LogoProps) {
  return (
    <Link
      href={href ?? (locale === "ar" ? "/ar" : "/")}
      className={`${styles.root} ${className ?? ""}`}
      aria-label={t(locale, "web.component.webNav.a11y.label.home")}
    >
      <span aria-hidden="true" className={styles.wordmark} />
    </Link>
  );
}
