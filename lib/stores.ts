import { env } from "./env";

export type PublicStore = { id: number; name: string; domain: string; country: string; url: string };
export type CountryGroup = { country: string; stores: PublicStore[] };

const HOME_COUNTRY = "EG";

/** GET /api/v1/stores/public, refreshed hourly. Any failure renders the empty state, never a broken build. */
export async function fetchStores(): Promise<PublicStore[]> {
  try {
    const res = await fetch(`${env.apiBaseUrl}/api/v1/stores/public`, {
      credentials: "omit",
      next: { revalidate: 3600 },
    } as RequestInit);
    if (!res.ok) return [];
    const body = (await res.json()) as { stores?: PublicStore[] };
    // the url lands in an href: only https links from the API are rendered
    return (body.stores ?? []).filter((s) => typeof s.url === "string" && s.url.startsWith("https://"));
  } catch {
    return [];
  }
}

/** Egypt (the launch market) first, then the other countries A to Z; store order is kept as the API sent it. */
export function groupByCountry(stores: PublicStore[]): CountryGroup[] {
  const byCountry = new Map<string, PublicStore[]>();
  for (const s of stores) byCountry.set(s.country, [...(byCountry.get(s.country) ?? []), s]);
  return [...byCountry.keys()]
    .sort((a, b) => (a === HOME_COUNTRY ? -1 : b === HOME_COUNTRY ? 1 : a.localeCompare(b)))
    .map((country) => ({ country, stores: byCountry.get(country)! }));
}
