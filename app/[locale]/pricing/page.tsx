import type { Metadata } from "next";
import Link from "next/link";
import StoreBadges from "../../components/StoreBadges";
import styles from "../../components/InfoPage.module.css";
import { env } from "../../../lib/env";
import { t, type Locale } from "../../../lib/i18n";
import { pathFor } from "../../../lib/locale";
import { pageMeta } from "../../../lib/seo";

const P = "web.pricing.noPrices.";
type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { ...pageMeta(locale, "/pricing", { noindex: true }), title: t(locale, P + "title"), description: t(locale, P + "subtitle") };
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  // Checkout starts in the apps: launched sends people to the stores, prelaunch to the waitlist.
  const waitlist = `${pathFor(locale, "/")}#waitlist`;
  const cta = (label: string, primary: boolean) => (
    <Link href={env.launch ? env.chromeStoreUrl! : waitlist} className={primary ? styles.btnPrimary : styles.btn}>{label}</Link>
  );
  const features = (plan: "free" | "pro") => (
    <ul className={styles.features}>
      {[1, 2, 3].map((n) => (
        <li key={n}><span aria-hidden="true" className={styles.check}>✓</span>{t(locale, `${P}plan.${plan}.feature.${n}`)}</li>
      ))}
    </ul>
  );
  return (
    <section className={`container ${styles.page} ${styles.center}`}>
      <h1 className={styles.h1}>{t(locale, P + "title")}</h1>
      <p className={styles.sub}>{t(locale, P + "subtitle")}</p>
      <div className={styles.plans}>
        <article className={`${styles.card} ${styles.cardPro}`}>
          <h2 className={styles.h2}>{t(locale, P + "plan.free.plan")}</h2>
          <p className={styles.period}>{t(locale, P + "plan.free.period")}</p>
          {features("free")}
          {cta(t(locale, P + "plan.free.label"), true)}
        </article>
        <article className={styles.card}>
          <h2 className={styles.h2}>{t(locale, P + "plan.pro.plan")}</h2>
          <p className={styles.price}>{t(locale, P + "plan.pro.price")}</p>
          <p className={styles.period}>{t(locale, P + "plan.pro.period")}</p>
          {features("pro")}
          {env.launch ? <StoreBadges locale={locale} /> : cta(t(locale, P + "plan.pro.label"), false)}
        </article>
      </div>
    </section>
  );
}
