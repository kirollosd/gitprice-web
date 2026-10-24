import type { Locale } from "./i18n";

export type TrackEvent =
  | { name: "waitlist_submit"; params: { audience: "shopper" | "seller"; placement: "hero" | "bottom" } }
  | { name: "cta_click"; params: { cta_id: string; placement: "nav" | "hero" | "bottom" | "menu" | "footer" } }
  | { name: "store_click"; params: { store: "chrome" | "app_store" | "play"; placement: string } }
  | { name: "section_view"; params: { section_id: string } }
  | { name: "locale_switch"; params: { from: Locale; to: Locale } }
  | { name: "menu_open"; params: Record<string, never> };

type Win = { dataLayer?: unknown[]; heap?: { track?: (name: string, props: object) => void } };

/** Pushes onto window.dataLayer (created if missing); never throws. */
export function pushDataLayer(item: object): void {
  try {
    const w = window as unknown as Win;
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push(item);
  } catch { /* analytics must never break the page */ }
}

/** Sends to GTM's dataLayer and, when loaded (after Allow), to Heap. `locale` is added from <html lang>. */
export function track<E extends TrackEvent>(name: E["name"], params: E["params"]): void {
  try {
    const locale = document.documentElement.lang;
    pushDataLayer({ event: name, ...params, locale });
    try { (window as unknown as Win).heap?.track?.(name, { ...params, locale }); } catch { /* Heap is best effort */ }
  } catch { /* analytics must never break the page */ }
}
