import type { Metadata } from "next";
import Link from "next/link";
import StoreBadges from "../../components/StoreBadges";
import styles from "../../components/InfoPage.module.css";
import { env } from "../../../lib/env";
import { t, type Locale } from "../../../lib/i18n";
import { pathFor } from "../../../lib/locale";
import { pageMeta } from "../../../lib/seo";
import { JoinCta } from "../../landing/Dock";

const P = "web.pricing.noPrices.";
const S = "web.component.webPricingCard.sellersRow.";
// The board's Free price is the numeral 0: a figure, not copy, the same in both locales (no i18n key exists for it).
const FREE_PRICE = "0";
type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMeta(locale, "/pricing", { noindex: true, title: t(locale, P + "title"), description: t(locale, P + "subtitle") });
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  // Checkout starts in the apps: launched sends people to the stores, prelaunch to the waitlist. Every waitlist CTA is the
  // shared coral primary (globals.css .gp-btn), one per plan card.
  const cta = (label: string) => env.launch ? (
    <Link href={env.chromeStoreUrl!} className={`${styles.btn} gp-btn`}>{label}</Link>
  ) : (
    <JoinCta label={label} className={`${styles.btn} gp-btn`} placement="pricing" />
  );
  return (
    <section className={`container ${styles.page} ${styles.center}`}>
      <h1 className={styles.h1}>{t(locale, P + "title")}</h1>
      <p className={styles.sub}>{t(locale, P + "subtitle")}</p>
      <div className={styles.plans}>
        <article className={`${styles.card} ${styles.cardPro}`}>
          <h2 className={styles.h2}>{t(locale, P + "plan.free.plan")}</h2>
          <p className={styles.price}><bdi dir="ltr">{FREE_PRICE}</bdi></p>
          <p className={styles.period}>{t(locale, P + "plan.free.period")}</p>
          {cta(t(locale, P + "plan.free.label"))}
        </article>
        <article className={styles.card}>
          <h2 className={styles.h2}>{t(locale, P + "plan.pro.plan")}</h2>
          <p className={styles.price}>{t(locale, P + "plan.pro.price")}</p>
          {env.launch ? <StoreBadges locale={locale} placement="bottom" /> : cta(t(locale, P + "plan.pro.label"))}
        </article>
      </div>
      <aside className={styles.sellersRow}>
        <h2 className={styles.sellersTitle}>{t(locale, S + "title")}</h2>
        <p className={styles.muted}>{t(locale, S + "body")}</p>
        <Link href={pathFor(locale, "/sellers")} className={`${styles.btn} gp-btn-2`}>{t(locale, S + "cta.label")}</Link>
      </aside>
    </section>
  );
}
