import type { Metadata } from "next";
import styles from "../../../components/Checkout.module.css";
import CheckoutReturn from "../../../components/CheckoutReturn";
import { t, type Locale } from "../../../../lib/i18n";
import { pageMeta } from "../../../../lib/seo";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { ...pageMeta(locale, "/checkout/return", { noindex: true }), title: t(locale, "web.checkout.waiting.title"), referrer: "no-referrer" };
}

export default async function CheckoutReturnPage({ params }: Props) {
  const { locale } = await params;
  return (
    <div className={styles.band}>
      <section className="container">
        <CheckoutReturn locale={locale} />
      </section>
    </div>
  );
}
