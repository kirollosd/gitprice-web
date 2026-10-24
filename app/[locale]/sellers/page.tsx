import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand, Steps, Waitlist } from "../../components/HomeSections";
import styles from "../../components/HomeSections.module.css";
import { env } from "../../../lib/env";
import { t, type Locale } from "../../../lib/i18n";
import { pathFor } from "../../../lib/locale";
import { pageMeta } from "../../../lib/seo";

const S = "web.sellers.";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return { ...pageMeta(locale, "/sellers"), title: t(locale, S + "hero.headline"), description: t(locale, S + "hero.sub") };
}

export default async function SellersPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const waitlistLabel = t(locale, S + "prelaunch.hero.waitlist.button.submitLabel");
  const access = (key: string) => (
    <a className={styles.accessBtn} href={env.chromeStoreUrl}>{t(locale, S + key)}</a>
  );
  return (
    <>
      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroText}>
            <Link href={pathFor(locale, "/")} className={styles.back}>{t(locale, S + "backToShoppers")}</Link>
            <h1 className={styles.h1}>{t(locale, S + "hero.headline")}</h1>
            <p className={styles.sub}>{t(locale, S + "hero.sub")}</p>
            <div id="waitlist" className={styles.action}>
              {env.launch ? access("launch.hero.access.label") : <Waitlist locale={locale} label={waitlistLabel} />}
            </div>
            {!env.launch && <p className={styles.caption}>{t(locale, S + "prelaunch.hero.waitlist.note")}</p>}
            <p className={styles.caption}>{t(locale, S + "hero.micro")}</p>
          </div>
          <div className={styles.visual} aria-hidden="true">
            <ul className={styles.rivals}>
              {[1, 2, 3].map((n) => (
                <li key={n} className={styles.rival}>
                  <span className={styles.rivalName}>{t(locale, `${S}visual.rival.${n}.name`)}</span>
                  <span className={styles.rivalCount}>{t(locale, `${S}visual.rival.${n}.count`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="sellers-features-h">
        <div className="container">
          <h2 id="sellers-features-h" className={styles.h2}>{t(locale, S + "features.heading")}</h2>
          <ul className={styles.cards} role="list">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className={styles.card}>
                <h3 className={styles.h3}>{t(locale, `${S}features.${n}.title`)}</h3>
                <p className={styles.muted}>{t(locale, `${S}features.${n}.body`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Steps locale={locale} prefix="web.sellers.how." />

      <section className={styles.section}>
        <div className="container">
          <p className={styles.who}>{t(locale, S + "who")}</p>
        </div>
      </section>

      {env.launch ? (
        <CtaBand title={t(locale, S + "launch.cta.title")}>
          {access("launch.cta.access.label")}
        </CtaBand>
      ) : (
        <CtaBand title={t(locale, S + "cta.title")} line={t(locale, S + "cta.line")}>
          <Waitlist locale={locale} label={t(locale, S + "cta.waitlist.button.submitLabel")} />
        </CtaBand>
      )}
    </>
  );
}
