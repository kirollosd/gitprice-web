import HomeContent from "../components/HomeSections";
import type { Locale } from "../../lib/i18n";

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <HomeContent locale={locale} />;
}
