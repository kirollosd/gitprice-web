import type { Metadata } from "next";
import StoresPage from "../../components/StoresPage";
import { t, type Locale } from "../../../lib/i18n";
import { pageMeta } from "../../../lib/seo";
import { fetchStores, groupByCountry } from "../../../lib/stores";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMeta(locale, "/stores", { title: t(locale, "web.stores.title"), description: t(locale, "web.stores.intro") });
}

export default async function Stores({ params }: Props) {
  const { locale } = await params;
  return <StoresPage locale={locale} groups={groupByCountry(await fetchStores())} />;
}
