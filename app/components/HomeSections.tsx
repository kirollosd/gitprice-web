import type { ReactNode } from "react";
import { t, type Locale } from "../../lib/i18n";
import b from "../landing/base.module.css";
import { CANVAS_BOOT, PICK_BOOT } from "../landing/canvas";
import CanvasFit from "../landing/CanvasFit";
import LandingBody from "../landing/LandingBody";
import ScrollScenes from "../landing/ScrollScenes";
import WaitlistForm from "./WaitlistForm";
import styles from "./HomeSections.module.css";

/** Prelaunch: the native waitlist form. Home is the shopper list unless a page says otherwise. */
export function Waitlist({ locale, label, audience = "shopper", placement }: { locale: Locale; label?: string; audience?: "shopper" | "seller"; placement: "hero" | "bottom" }) {
  return <WaitlistForm locale={locale} label={label} audience={audience} placement={placement} />;
}

/** The numbered steps shared by Home and Sellers. */
export function Steps({ locale, id, prefix }: { locale: Locale; id?: string; prefix: "web.home.how." | "web.sellers.how." }) {
  return (
    <section id={id} className={styles.stepsBand} aria-labelledby={`${prefix}h`} data-gp-section="how-it-works">
      <div className="container">
        <h2 id={`${prefix}h`} className={styles.h2}>{t(locale, prefix + "heading")}</h2>
        <ol className={styles.steps}>
          {[1, 2, 3].map((n) => (
            <li key={n} className={styles.step}>
              <span className={styles.num} aria-hidden="true">{n}</span>
              <h3 className={styles.stepTitle}>{t(locale, `${prefix}${n}.title`)}</h3>
              <p className={styles.muted}>{t(locale, `${prefix}${n}.body`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Closing band on the ink ground; the form or button sits on a surface card. */
export function CtaBand({ title, line, children, below }: { title: string; line?: string; children: ReactNode; below?: ReactNode }) {
  return (
    <section className={styles.band} data-gp-section="bottom_cta">
      <div className={`container ${styles.bandInner}`}>
        <div>
          <h2 className={styles.bandTitle}>{title}</h2>
          {line && <p className={styles.bandLine}>{line}</p>}
        </div>
        <div className={styles.bandCard}>{children}</div>
        {below}
      </div>
    </section>
  );
}

/**
 * Home body: the Coral landing sections in mock order on the zoomed canvas (see app/landing/canvas.ts).
 * The sections render client-side around the picked product (?p=, LandingBody); the dock lives in the layout.
 */
export default function HomeContent({ locale }: { locale: Locale }) {
  return (
    <div className={b.shell}>
      <div className={b.canvas}>
        <script dangerouslySetInnerHTML={{ __html: CANVAS_BOOT + ";" + PICK_BOOT }} />
        <CanvasFit />
        <LandingBody locale={locale} />
        <ScrollScenes locale={locale} />
      </div>
    </div>
  );
}
