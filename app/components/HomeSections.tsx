import Link from "next/link";
import type { ReactNode } from "react";
import { env } from "../../lib/env";
import { t, type Locale } from "../../lib/i18n";
import { pathFor } from "../../lib/locale";
import StoreBadges from "./StoreBadges";
import TallyEmbed from "./TallyEmbed";
import styles from "./HomeSections.module.css";

const H = "web.home.";

/** Prelaunch: the Tally waitlist form. */
export function Waitlist({ locale, label }: { locale: Locale; label?: string }) {
  return <TallyEmbed formId={env.tallyFormId} locale={locale} label={label} />;
}

/** The numbered steps shared by Home and Sellers. */
export function Steps({ locale, id, prefix }: { locale: Locale; id?: string; prefix: "web.home.how." | "web.sellers.how." }) {
  return (
    <section id={id} className={styles.section} aria-labelledby={`${prefix}h`}>
      <div className="container">
        <h2 id={`${prefix}h`} className={styles.h2}>{t(locale, prefix + "heading")}</h2>
        <ol className={styles.steps}>
          {[1, 2, 3].map((n) => (
            <li key={n} className={styles.step}>
              <span className={styles.num} aria-hidden="true">{n}</span>
              <h3 className={styles.h3}>{t(locale, `${prefix}${n}.title`)}</h3>
              <p className={styles.muted}>{t(locale, `${prefix}${n}.body`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Closing band on the ink ground; the form or button sits on a surface card. */
export function CtaBand({ title, line, children }: { title: string; line?: string; children: ReactNode }) {
  return (
    <section className={styles.band}>
      <div className={`container ${styles.bandInner}`}>
        <div>
          <h2 className={styles.bandTitle}>{title}</h2>
          {line && <p className={styles.bandLine}>{line}</p>}
        </div>
        <div className={styles.bandCard}>{children}</div>
      </div>
    </section>
  );
}

function Visual({ locale }: { locale: Locale }) {
  const V = H + "visual.";
  return (
    <div className={styles.visual} aria-hidden="true">
      <div className={styles.priceCard}>
        <div className={styles.priceRow}>
          <div>
            <p className={styles.caption}>{t(locale, V + "pricerowcompact.store")}</p>
            <p className={styles.productTitle}>{t(locale, V + "pricerowcompact.title")}</p>
          </div>
          <p className={styles.saving}>{t(locale, V + "pricerowcompact.saving")}</p>
        </div>
        <p className={styles.otherStore}>{t(locale, V + "pricerowcompact.store2")}</p>
        <p className={styles.otherStore}>{t(locale, V + "pricerowcompact.store3")}</p>
      </div>
      <p className={styles.toast}>{t(locale, V + "toast.message")}</p>
    </div>
  );
}

function Hero({ locale }: { locale: Locale }) {
  return (
    <section className={styles.hero}>
      <div className={`container ${styles.heroGrid}`}>
        <div className={styles.heroText}>
          <h1 className={styles.h1}>{t(locale, H + "hero.headline")}</h1>
          <p className={styles.sub}>{t(locale, H + "hero.sub")}</p>
          <div id="waitlist" className={styles.action}>
            {env.launch ? <StoreBadges locale={locale} /> : <Waitlist locale={locale} />}
          </div>
          <p className={styles.caption}>{t(locale, H + "free.label")}</p>
        </div>
        <Visual locale={locale} />
      </div>
    </section>
  );
}

function Proof({ locale }: { locale: Locale }) {
  return (
    <ul className={`container ${styles.proof}`} role="list">
      {[1, 2, 3].map((n) => (
        <li key={n}>{t(locale, `${H}proof.${n}`)}</li>
      ))}
    </ul>
  );
}

function Features({ locale }: { locale: Locale }) {
  return (
    <section id="features" className={styles.section} aria-labelledby="features-h">
      <div className="container">
        <h2 id="features-h" className={styles.h2}>{t(locale, H + "features.heading")}</h2>
        <ul className={styles.cards} role="list">
          {(["rows", "alerts", "history"] as const).map((k) => (
            <li key={k} className={styles.card}>
              <h3 className={styles.h3}>{t(locale, `${H}features.${k}.title`)}</h3>
              <p className={styles.muted}>{t(locale, `${H}features.${k}.body`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Privacy({ locale }: { locale: Locale }) {
  return (
    <section className={styles.section} aria-labelledby="privacy-h">
      <div className="container">
        <h2 id="privacy-h" className={styles.h2}>{t(locale, H + "privacy.heading")}</h2>
        <ul className={styles.points} role="list">
          {[1, 2, 3].map((n) => (
            <li key={n}>{t(locale, `${H}privacy.point${n}`)}</li>
          ))}
        </ul>
        <Link href={pathFor(locale, "/privacy")} className={styles.textLink}>{t(locale, H + "privacy.link")}</Link>
      </div>
    </section>
  );
}

function Faq({ locale }: { locale: Locale }) {
  return (
    <section className={styles.section} aria-labelledby="faq-h">
      <div className={`container ${styles.faq}`}>
        <h2 id="faq-h" className={styles.h2}>{t(locale, H + "faq.heading")}</h2>
        {[1, 2, 3, 4, 5].map((n) => (
          <details key={n} className={styles.qa}>
            <summary>{t(locale, `${H}faq.${n}.q`)}</summary>
            <p className={styles.muted}>{t(locale, `${H}faq.${n}.a`)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** Home body. `env.launch` picks the Home/launch or Home/prelaunch board. */
export default function HomeContent({ locale }: { locale: Locale }) {
  return (
    <>
      <Hero locale={locale} />
      <Proof locale={locale} />
      <Features locale={locale} />
      <Steps locale={locale} id="how-it-works" prefix="web.home.how." />
      <Privacy locale={locale} />
      <Faq locale={locale} />
      {env.launch ? (
        <CtaBand title={t(locale, H + "launch.cta.title")} line={t(locale, H + "launch.cta.line")}>
          <StoreBadges locale={locale} />
        </CtaBand>
      ) : (
        <CtaBand title={t(locale, H + "cta.title")} line={t(locale, H + "cta.line")}>
          <Waitlist locale={locale} />
        </CtaBand>
      )}
    </>
  );
}
