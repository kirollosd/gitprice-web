import { env } from "../../lib/env";
import { t, type Locale } from "../../lib/i18n";
import styles from "./StoreBadges.module.css";

const B = "web.component.webStoreBadges.default.";

/**
 * Launch CTA: Add to Chrome at every width, App Store and Google Play below 768.
 * The design stand-ins are plain token-styled links; no official artwork is bundled.
 */
export default function StoreBadges({ locale }: { locale: Locale }) {
  return (
    <div className={styles.root}>
      <a className={styles.chrome} href={env.chromeStoreUrl}>{t(locale, B + "button.addToChrome.label")}</a>
      <div className={styles.mobile}>
        <a className={styles.badge} href={env.appStoreUrl}>
          <span className={styles.top}>{t(locale, B + "label.appStore.top")}</span>
          <span className={styles.name}>{t(locale, B + "label.appStoreText")}</span>
        </a>
        <a className={styles.badge} href={env.playStoreUrl}>
          <span className={styles.top}>{t(locale, B + "label.googlePlay.top")}</span>
          <span className={styles.name}>{t(locale, B + "label.googlePlayText")}</span>
        </a>
      </div>
    </div>
  );
}
