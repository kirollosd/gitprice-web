import type { Metadata } from "next";
import styles from "../../components/InfoPage.module.css";
import { t, type Locale } from "../../../lib/i18n";
import { pageMeta } from "../../../lib/seo";

const W = "web.welcome.";
type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { ...pageMeta(locale, "/welcome", { noindex: true }), title: t(locale, W + "title"), description: t(locale, W + "subtitle") };
}

export default async function WelcomePage({ params }: Props) {
  const { locale } = await params;
  return (
    <section className={`container ${styles.page}`}>
      <h1 className={styles.h1}>{t(locale, W + "title")}</h1>
      <p className={styles.sub}>{t(locale, W + "subtitle")}</p>
      <ol className={styles.steps}>
        {[1, 2].map((n) => (
          <li key={n} className={styles.card}>
            <p className={styles.eyebrow}>{t(locale, `${W}step${n}.eyebrow`)}</p>
            <h2 className={styles.h2}>{t(locale, `${W}step${n}.title`)}</h2>
            <p className={styles.muted}>{t(locale, `${W}step${n}.body`)}</p>
          </li>
        ))}
      </ol>
      {/* The account lives in the extension, so there is no web target for the sign-in link. */}
      <p className={styles.muted}>
        {t(locale, W + "signin.text")} <strong>{t(locale, W + "signin.link")}</strong>
      </p>
    </section>
  );
}
