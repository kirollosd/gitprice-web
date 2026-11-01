import type { Metadata } from "next";
import StatusIcon from "../../../components/StatusIcon";
import styles from "../../../components/Hosted.module.css";
import { t, type Locale } from "../../../../lib/i18n";
import { pageMeta } from "../../../../lib/seo";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMeta(locale, "/auth/confirmed", { noindex: true, title: t(locale, "web.auth.confirmed.title") });
}

/** Static and token-free: it only tells the user where to go next. */
export default async function ConfirmedPage({ params }: Props) {
  const { locale } = await params;
  return (
    <div className={styles.band}>
      <section className="container">
        <div className={styles.card}>
          <div className={styles.head}>
            <StatusIcon kind="check" />
            <h1 className={styles.h1}>{t(locale, "web.auth.confirmed.title")}</h1>
            <p className={styles.muted}>{t(locale, "web.auth.confirmed.body")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
