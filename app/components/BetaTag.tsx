import { t, type Locale } from "../../lib/i18n";
import styles from "./BetaTag.module.css";

/** Launch phase 1 label, next to the CTAs and in the footer. A missing key throws, so a forgotten sync fails the build. */
export default function BetaTag({ locale }: { locale: Locale }) {
  return <span className={styles.beta} data-beta="">{t(locale, "web.landing.beta")}</span>;
}
