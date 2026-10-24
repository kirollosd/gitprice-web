import type { ReactNode } from "react";
import { t, type Locale } from "../../lib/i18n";
import styles from "./Checkout.module.css";

/** The live region stays mounted across states so a screen reader hears each change. */
export default function CheckoutCard({ locale, k, spinner, busy, children }: {
  locale: Locale;
  k?: string;
  spinner?: boolean;
  busy?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={styles.card}>
      <div role="status" aria-live="polite" aria-busy={busy || undefined}>
        {k && <h1 className={styles.h1}>{t(locale, `web.checkout.${k}.title`)}</h1>}
        {k && <p className={styles.muted}>{t(locale, `web.checkout.${k}.body`)}</p>}
        {spinner && <div className={styles.spinner} aria-hidden="true" />}
      </div>
      {children}
    </div>
  );
}
