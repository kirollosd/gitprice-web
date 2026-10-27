import type { Metadata } from "next";
import LegalPage from "../../components/LegalPage";
import { t, type Locale } from "../../../lib/i18n";
import { pageMeta } from "../../../lib/seo";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMeta(locale, "/terms", { title: t(locale, "web.terms.title"), description: t(locale, "web.terms.intro") });
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  return <LegalPage locale={locale} name="terms" />;
}
