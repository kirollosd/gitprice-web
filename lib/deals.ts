import { env } from "./env";
import { emptyAtBuild } from "./isr-fallback";

export const LIST_KEY_RE = /^[a-z][a-z0-9_]{1,31}$/;
export type DealList = { key: string; nameEn: string; nameAr: string; count: number };
export type DealInsight = { kind: string; otherStore?: string; diff?: number; ref?: number; refDay?: string };
export type PublicDeal = {
  title: string;
  storeName: string;
  price: number;
  currency: string;
  observedAt: string;
  insights: DealInsight[];
  buyUrl: string;
  productUrl: string;
  status: string;
  listKey: string;
  listNameEn: string;
  listNameAr: string;
};

const REVALIDATE_SECONDS = 120;

/** GET /api/v1/deals (the deals channel's live posts), refreshed every 2 minutes. An invalid list key is dropped, so the unfiltered feed is read. A failure renders the empty state at build time and throws at runtime; /deals catches it (settle) and serves a noindex empty state. */
export async function fetchDeals(list?: string): Promise<PublicDeal[]> {
  try {
    const params = new URLSearchParams({ limit: "60" });
    if (list && LIST_KEY_RE.test(list)) params.set("list", list);
    const res = await fetch(`${env.apiBaseUrl}/api/v1/deals?${params}`, {
      credentials: "omit",
      next: { revalidate: REVALIDATE_SECONDS },
    } as RequestInit);
    if (!res.ok) throw new Error(`deals feed: HTTP ${res.status}`);
    const body = (await res.json()) as { deals?: PublicDeal[] };
    // the buy link lands in an href: only https links from the API are rendered
    return (body.deals ?? []).filter((d) => typeof d.buyUrl === "string" && d.buyUrl.startsWith("https://"));
  } catch (err) {
    return emptyAtBuild<PublicDeal[]>([], err);
  }
}

/** GET /api/v1/deals/lists: the filter chips, only lists with live posts. Same failure rules as fetchDeals. */
export async function fetchDealLists(): Promise<DealList[]> {
  try {
    const res = await fetch(`${env.apiBaseUrl}/api/v1/deals/lists`, {
      credentials: "omit",
      next: { revalidate: REVALIDATE_SECONDS },
    } as RequestInit);
    if (!res.ok) throw new Error(`deal lists: HTTP ${res.status}`);
    const body = (await res.json()) as { lists?: DealList[] };
    return (body.lists ?? []).filter(
      (l) => !!l && typeof l.key === "string" && LIST_KEY_RE.test(l.key) && typeof l.nameEn === "string" && typeof l.nameAr === "string" && Number.isFinite(l.count) && l.count > 0,
    );
  } catch (err) {
    return emptyAtBuild<DealList[]>([], err);
  }
}

/**
 * Runs an API read for a dynamic page: a failure becomes an empty result the page can render calmly, flagged so the
 * page can be noindex. Logs a fixed line with the error name and HTTP status only: never the URL, query or a body.
 */
export async function settle<T>(read: Promise<T[]>, log = true): Promise<{ data: T[]; failed: boolean }> {
  try {
    return { data: await read, failed: false };
  } catch (err) {
    if (log) {
      const name = err instanceof Error ? err.name : "unknown";
      const status = err instanceof Error ? /HTTP (\d{3})/.exec(err.message)?.[1] : undefined;
      console.error(`deals page: API read failed (${name}${status ? `, HTTP ${status}` : ""})`);
    }
    return { data: [], failed: true };
  }
}

export function listName(l: { nameEn: string; nameAr: string }, locale: "en" | "ar"): string {
  return locale === "ar" ? l.nameAr : l.nameEn;
}

const cairoTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Cairo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

const cairoIsoDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" });

/** The Cairo calendar day as YYYY-MM-DD. */
export function cairoDay(d: Date): string {
  return cairoIsoDay.format(d);
}

/** When the price was seen, as Cairo DD/MM HH:MM with Latin digits in both languages, so a post from yesterday never reads as today. */
export function formatDealTime(iso: string): string {
  return cairoTime.format(new Date(iso)).replace(",", "");
}

/** Latin digits, comma thousands, decimals only when not whole: the channel's FormatEGP. */
export function formatEGP(v: number): string {
  const whole = Number.isInteger(v);
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(v);
}
