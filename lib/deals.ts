import { env } from "./env";
import { emptyAtBuild } from "./isr-fallback";

export type DealInsight = { kind: string; otherStore?: string; diff?: number };
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
};

/** GET /api/v1/deals (the deals channel's live posts), refreshed every 2 minutes. A failure renders the empty state at build time and keeps the last good page at runtime. */
export async function fetchDeals(): Promise<PublicDeal[]> {
  try {
    const res = await fetch(`${env.apiBaseUrl}/api/v1/deals?limit=30`, {
      credentials: "omit",
      next: { revalidate: 120 },
    } as RequestInit);
    if (!res.ok) throw new Error(`deals feed: HTTP ${res.status}`);
    const body = (await res.json()) as { deals?: PublicDeal[] };
    // the buy link lands in an href: only https links from the API are rendered
    return (body.deals ?? []).filter((d) => typeof d.buyUrl === "string" && d.buyUrl.startsWith("https://"));
  } catch (err) {
    return emptyAtBuild<PublicDeal[]>([], err);
  }
}

const cairoTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Cairo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

/** When the price was seen, as Cairo DD/MM HH:MM with Latin digits in both languages, so a post from yesterday never reads as today. */
export function formatDealTime(iso: string): string {
  return cairoTime.format(new Date(iso)).replace(",", "");
}

/** Latin digits, comma thousands, decimals only when not whole: the channel's FormatEGP. */
export function formatEGP(v: number): string {
  const whole = Number.isInteger(v);
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(v);
}
