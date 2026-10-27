import { t, type Locale } from "../../lib/i18n";
import styles from "./BetaTag.module.css";

/** Launch phase 1 label, next to the CTAs and in the footer. Always the Latin word "Beta" (owner), so it is an LTR-isolated English run inside RTL pages. A missing key throws, so a forgotten sync fails the build. */
export default function BetaTag({ locale, className }: { locale: Locale; className?: string }) {
  return <span className={className ? `${styles.beta} ${className}` : styles.beta} data-beta="" dir="ltr" lang="en">{t(locale, "web.landing.beta")}</span>;
}
