import { env } from "./env";
import { emptyAtBuild } from "./isr-fallback";
import { outUrl } from "./outbound";

/** url is the tagged homepage; homepage is the plain one, for the click-tracked /out (older APIs omit it). */
export type PublicStore = { id: number; name: string; domain: string; country: string; url: string; homepage?: string };
export type CountryGroup = { country: string; stores: PublicStore[] };

const HOME_COUNTRY = "EG";
/** Shown first within their country group, in this order; matched on the exact API domain. */
const FEATURED_DOMAINS = ["amazon.eg", "noon.com", "jumia.com.eg"];
const featuredRank = (s: PublicStore) => {
  const i = FEATURED_DOMAINS.indexOf(s.domain);
  return i === -1 ? FEATURED_DOMAINS.length : i;
};

/** GET /api/v1/stores/public, refreshed hourly (only the store list: links resolve at click time through /out). A failure renders the empty state at build time and keeps the last good page at runtime. */
export async function fetchStores(): Promise<PublicStore[]> {
  try {
    const res = await fetch(`${env.apiBaseUrl}/api/v1/stores/public`, {
      credentials: "omit",
      next: { revalidate: 3600 },
    } as RequestInit);
    if (!res.ok) throw new Error(`stores feed: HTTP ${res.status}`);
    const body = (await res.json()) as { stores?: PublicStore[] };
    // the url lands in an href: only https links from the API are rendered
    return (body.stores ?? []).filter((s) => typeof s.url === "string" && s.url.startsWith("https://"));
  } catch (err) {
    return emptyAtBuild<PublicStore[]>([], err);
  }
}

/**
 * Egypt (the launch market) first, then the other countries A to Z. Within a group, Amazon, Noon and Jumia
 * (domains amazon.eg, noon.com, jumia.com.eg) come first in that order; every other store keeps the API order.
 */
export function groupByCountry(stores: PublicStore[]): CountryGroup[] {
  const byCountry = new Map<string, PublicStore[]>();
  for (const s of stores) byCountry.set(s.country, [...(byCountry.get(s.country) ?? []), s]);
  return [...byCountry.keys()]
    .sort((a, b) => (a === HOME_COUNTRY ? -1 : b === HOME_COUNTRY ? 1 : a.localeCompare(b)))
    .map((country) => ({ country, stores: [...byCountry.get(country)!].sort((a, b) => featuredRank(a) - featuredRank(b)) }));
}

/** The store's href: the click-tracked /out for its plain homepage, else the tagged url (an API without homepage has no /out). */
export function storeHref(s: PublicStore): string {
  return typeof s.homepage === "string" && s.homepage.startsWith("https://") ? outUrl(s.homepage, "stores") : s.url;
}
