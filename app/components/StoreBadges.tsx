import { env } from "../../lib/env";
import { t, type Locale } from "../../lib/i18n";
import styles from "./StoreBadges.module.css";

const B = "web.component.webStoreBadges.default.";
/** Launch phase 1 is extension only; flip to true in phase 2 to bring back the App Store and Google Play badges (below 768). */
export const MOBILE_APPS_ENABLED = false;

/**
 * Launch CTA: Add to Chrome at every width, plus App Store and Google Play below 768 when MOBILE_APPS_ENABLED.
 * The design stand-ins are plain token-styled links; no official artwork is bundled.
 */
export default function StoreBadges({ locale, placement }: { locale: Locale; placement: "hero" | "bottom" | "dock" }) {
  return (
    <div className={styles.root}>
      <a className={`${styles.chrome} gp-btn${placement === "dock" ? " gp-btn-sm" : ""}`} href={env.chromeStoreUrl} data-gp-track="store_click" data-gp-store="chrome" data-gp-placement={placement}>{t(locale, B + "button.addToChrome.label")}</a>
      {MOBILE_APPS_ENABLED && (
        <div className={styles.mobile}>
          <a className={styles.badge} href={env.appStoreUrl} data-gp-track="store_click" data-gp-store="app_store" data-gp-placement={placement}>
            <span className={styles.top}>{t(locale, B + "label.appStore.top")}</span>
            <span className={styles.name}>{t(locale, B + "label.appStoreText")}</span>
          </a>
          <a className={styles.badge} href={env.playStoreUrl} data-gp-track="store_click" data-gp-store="play" data-gp-placement={placement}>
            <span className={styles.top}>{t(locale, B + "label.googlePlay.top")}</span>
            <span className={styles.name}>{t(locale, B + "label.googlePlayText")}</span>
          </a>
        </div>
      )}
    </div>
  );
}
