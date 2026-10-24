import type { Metadata } from "next";
import { notFound } from "next/navigation";
import styles from "../../components/Checkout.module.css";
import CheckoutFlow from "../../components/CheckoutFlow";
import { t, type Locale } from "../../../lib/i18n";
import { env } from "../../../lib/env";
import { pageMeta } from "../../../lib/seo";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { ...pageMeta(locale, "/checkout", { noindex: true, title: t(locale, "web.checkout.summary.title") }), referrer: "no-referrer" };
}

export default async function CheckoutPage({ params }: Props) {
  if (!env.checkout) notFound();
  const { locale } = await params;
  return (
    <div className={styles.band}>
      <section className="container">
        <CheckoutFlow locale={locale} />
      </section>
    </div>
  );
}
