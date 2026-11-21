import { env } from "./env";

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

/** GET /api/v1/deals (the deals channel's live posts), refreshed every 2 minutes. Any failure renders the empty state. */
export async function fetchDeals(): Promise<PublicDeal[]> {
  try {
    const res = await fetch(`${env.apiBaseUrl}/api/v1/deals?limit=30`, {
      credentials: "omit",
      next: { revalidate: 120 },
    } as RequestInit);
    if (!res.ok) return [];
    const body = (await res.json()) as { deals?: PublicDeal[] };
    // the buy link lands in an href: only https links from the API are rendered
    return (body.deals ?? []).filter((d) => typeof d.buyUrl === "string" && d.buyUrl.startsWith("https://"));
  } catch {
    return [];
  }
}

const cairoTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** When the price was seen, as Cairo HH:MM with Latin digits in both languages (the channel's time line). */
export function formatDealTime(iso: string): string {
  return cairoTime.format(new Date(iso));
}

/** Latin digits, comma thousands, decimals only when not whole: the channel's FormatEGP. */
export function formatEGP(v: number): string {
  const whole = Number.isInteger(v);
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(v);
}
