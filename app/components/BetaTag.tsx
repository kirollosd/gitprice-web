import { t, type Locale } from "../../lib/i18n";
import styles from "./BetaTag.module.css";

const KEY = "web.landing.beta";

/** Launch phase 1 label, next to the CTAs and in the footer. */
export default function BetaTag({ locale }: { locale: Locale }) {
  // ponytail: web.landing.beta arrives with the next design sync; until then t() throws in dev/test, so show the raw key (what production returns). Drop the try once synced.
  let text = KEY;
  try { text = t(locale, KEY); } catch { /* key not synced yet */ }
  return <span className={styles.beta} data-beta="">{text}</span>;
}
