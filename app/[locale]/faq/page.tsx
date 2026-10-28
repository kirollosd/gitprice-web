import type { Metadata } from "next";
import FaqPage from "../../components/FaqPage";
import { t, type Locale } from "../../../lib/i18n";
import { pageMeta } from "../../../lib/seo";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMeta(locale, "/faq", { title: t(locale, "web.faq.title"), description: t(locale, "web.faq.intro") });
}

export default async function Faq({ params }: Props) {
  const { locale } = await params;
  return <FaqPage locale={locale} />;
}
