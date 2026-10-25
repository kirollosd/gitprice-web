import type { Metadata } from "next";
import HomeContent from "../components/HomeSections";
import { t, type Locale } from "../../lib/i18n";
import { pageMeta } from "../../lib/seo";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMeta(locale, "/", { title: t(locale, "web.home.hero.headline"), description: t(locale, "web.home.hero.sub") });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  return <HomeContent locale={locale} />;
}
