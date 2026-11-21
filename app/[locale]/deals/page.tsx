import type { Metadata } from "next";
import DealsPage from "../../components/DealsPage";
import { fetchDeals } from "../../../lib/deals";
import { t, type Locale } from "../../../lib/i18n";
import { pageMeta } from "../../../lib/seo";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMeta(locale, "/deals", { title: t(locale, "web.deals.title"), description: t(locale, "web.deals.intro") });
}

export default async function Deals({ params }: Props) {
  const { locale } = await params;
  return <DealsPage locale={locale} deals={await fetchDeals()} />;
}
