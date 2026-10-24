import type { Metadata } from "next";
import ResetPasswordForm from "../../components/ResetPasswordForm";
import { t, type Locale } from "../../../lib/i18n";
import { pageMeta } from "../../../lib/seo";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { ...pageMeta(locale, "/reset-password", { noindex: true }), title: t(locale, "web.resetPassword.title") };
}

export default async function ResetPasswordPage({ params }: Props) {
  const { locale } = await params;
  return (
    <section className="container" style={{ paddingBlock: "var(--gp-sp-12) var(--gp-sp-16)" }}>
      <ResetPasswordForm locale={locale} />
    </section>
  );
}
