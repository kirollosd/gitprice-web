import type { Metadata } from "next";
import DealsPage from "../../components/DealsPage";
import { fetchDealLists, fetchDeals, listName, type DealList } from "../../../lib/deals";
import { t, type Locale } from "../../../lib/i18n";
import { pageMeta } from "../../../lib/seo";

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ list?: string | string[] }> };

/** An unknown or invalid ?list= is "All", never an error. */
function pick(lists: DealList[], list: string | string[] | undefined): DealList | null {
  const key = Array.isArray(list) ? list[0] : list;
  return lists.find((l) => l.key === key) ?? null;
}

// ?list= makes the page dynamic, so a failed API read must not 500 it: the calm empty state (the fetches stay cached 2 min).
const orEmpty = <T,>(p: Promise<T[]>): Promise<T[]> => p.catch(() => []);

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ locale }, { list }] = await Promise.all([params, searchParams]);
  const sel = pick(await orEmpty(fetchDealLists()), list);
  const title = t(locale, "web.deals.title");
  // canonical stays /deals: the filtered view is a variant of it
  return pageMeta(locale, "/deals", { title: sel ? `${title}: ${listName(sel, locale)}` : title, description: t(locale, "web.deals.intro") });
}

export default async function Deals({ params, searchParams }: Props) {
  const [{ locale }, { list }] = await Promise.all([params, searchParams]);
  const lists = await orEmpty(fetchDealLists());
  const selected = pick(lists, list)?.key ?? null;
  return <DealsPage locale={locale} deals={await orEmpty(fetchDeals(selected ?? undefined))} lists={lists} selected={selected} />;
}
