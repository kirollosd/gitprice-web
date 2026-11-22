import type { Metadata } from "next";
import DealsPage from "../../components/DealsPage";
import { fetchDealLists, fetchDeals, listName, settle, type DealList } from "../../../lib/deals";
import { t, type Locale } from "../../../lib/i18n";
import { pageMeta } from "../../../lib/seo";

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ list?: string | string[] }> };

/** An unknown or invalid ?list= is "All", never an error. */
function pick(lists: DealList[], list: string | string[] | undefined): DealList | null {
  const key = Array.isArray(list) ? list[0] : list;
  return lists.find((l) => l.key === key) ?? null;
}

// ?list= makes the page dynamic, so a failed API read must not 500 it: users get the calm empty state, the failure is logged
// server-side (settle) and the render is noindex (generateMetadata), so an outage is never indexed as an empty page.
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ locale }, { list }] = await Promise.all([params, searchParams]);
  // the page logs a failure; this second read of the same cached fetches stays quiet
  const lists = await settle(fetchDealLists(), false);
  const sel = pick(lists.data, list);
  const deals = await settle(fetchDeals(sel?.key), false);
  const title = t(locale, "web.deals.title");
  // canonical stays /deals: the filtered view is a variant of it
  return pageMeta(locale, "/deals", {
    title: sel ? `${title}: ${listName(sel, locale)}` : title,
    description: t(locale, "web.deals.intro"),
    noindex: lists.failed || deals.failed,
  });
}

export default async function Deals({ params, searchParams }: Props) {
  const [{ locale }, { list }] = await Promise.all([params, searchParams]);
  const lists = (await settle(fetchDealLists())).data;
  const selected = pick(lists, list)?.key ?? null;
  const { data: deals } = await settle(fetchDeals(selected ?? undefined));
  return <DealsPage locale={locale} deals={deals} lists={lists} selected={selected} />;
}
