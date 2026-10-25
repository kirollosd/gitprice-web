import type { Metadata } from "next";
import Link from "next/link";
import { RivalsArt } from "../../components/BoardArt";
import { CtaBand, Steps, Waitlist } from "../../components/HomeSections";
import styles from "../../components/HomeSections.module.css";
import { env } from "../../../lib/env";
import { t, type Locale } from "../../../lib/i18n";
import { pathFor } from "../../../lib/locale";
import { pageMeta } from "../../../lib/seo";

const S = "web.sellers.";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMeta(locale, "/sellers", { title: t(locale, S + "hero.headline"), description: t(locale, S + "hero.sub") });
}

export default async function SellersPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const waitlistLabel = t(locale, S + "prelaunch.hero.waitlist.button.submitLabel");
  const access = (key: string, placement: "hero" | "bottom") => (
    <a className={styles.accessBtn} href={env.chromeStoreUrl} data-gp-track="cta_click" data-gp-cta-id="install_extension" data-gp-placement={placement}>{t(locale, S + key)}</a>
  );
  return (
    <>
      <section className={`${styles.hero} ${styles.sellersHero}`} data-gp-section="hero">
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroText}>
            <h1 className={styles.h1}>{t(locale, S + "hero.headline")}</h1>
            <p className={styles.sub}>{t(locale, S + "hero.sub")}</p>
            <p className={styles.micro}>{t(locale, S + "hero.micro")}</p>
            <div id="waitlist" className={styles.action}>
              {env.launch ? access("launch.hero.access.label", "hero") : <Waitlist locale={locale} label={waitlistLabel} audience="seller" placement="hero" />}
            </div>
          </div>
          <RivalsArt locale={locale} />
        </div>
      </section>

      <section id="features" className={styles.section} aria-labelledby="sellers-features-h" data-gp-section="features">
        <div className="container">
          <h2 id="sellers-features-h" className={styles.h2}>{t(locale, S + "features.heading")}</h2>
          <ul className={styles.sellerItems} role="list">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <li key={n} className={styles.sellerItem}>
                <h3 className={styles.sellerTitle}>{t(locale, `${S}features.${n}.title`)}</h3>
                <p className={styles.itemBody}>{t(locale, `${S}features.${n}.body`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Steps locale={locale} id="how-it-works" prefix="web.sellers.how." />

      <section className={styles.section} data-gp-section="who">
        <div className="container">
          <p className={styles.who}>{t(locale, S + "who")}</p>
        </div>
      </section>

      {env.launch ? (
        <CtaBand title={t(locale, S + "launch.cta.title")}>
          {access("launch.cta.access.label", "bottom")}
        </CtaBand>
      ) : (
        <CtaBand title={t(locale, S + "cta.title")} line={t(locale, S + "cta.line")}>
          <Waitlist locale={locale} label={t(locale, S + "cta.waitlist.button.submitLabel")} audience="seller" placement="bottom" />
        </CtaBand>
      )}
      <div className={`container ${styles.backRow}`}>
        <Link href={pathFor(locale, "/")} className={styles.back} data-gp-track="cta_click" data-gp-cta-id="back_to_shoppers" data-gp-placement="bottom">{t(locale, S + "backToShoppers")}</Link>
      </div>
    </>
  );
}
