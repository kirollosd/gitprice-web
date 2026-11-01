import type { Metadata } from "next";
import ConfirmEmail from "../../../components/ConfirmEmail";
import styles from "../../../components/Hosted.module.css";
import { t, type Locale } from "../../../../lib/i18n";
import { pageMeta } from "../../../../lib/seo";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMeta(locale, "/auth/confirm", { noindex: true, title: t(locale, "web.auth.confirm.title") });
}

export default async function ConfirmPage({ params }: Props) {
  const { locale } = await params;
  return (
    <div className={styles.band}>
      <section className="container">
        <ConfirmEmail locale={locale} />
      </section>
    </div>
  );
}
