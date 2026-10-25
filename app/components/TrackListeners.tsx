"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { pushDataLayer, track } from "../../lib/track";

const ID = /^[a-z0-9_-]{1,64}$/;
const PLACEMENTS = ["nav", "hero", "bottom", "menu", "footer"];
const STORES = ["chrome", "app_store", "play"];
const LOCALES = ["en", "ar"];

/** Turns a click on a `data-gp-track` element into an event. Unknown or malformed values are ignored. */
function onClick(e: MouseEvent) {
  const el = (e.target as Element | null)?.closest?.<HTMLElement>("[data-gp-track]");
  if (!el) return;
  const d = el.dataset;
  const placement = d.gpPlacement ?? "";
  if (d.gpTrack === "cta_click" && ID.test(d.gpCtaId ?? "") && PLACEMENTS.includes(placement)) {
    track("cta_click", { cta_id: d.gpCtaId!, placement: placement as "nav" });
  } else if (d.gpTrack === "store_click" && STORES.includes(d.gpStore ?? "") && ID.test(placement)) {
    track("store_click", { store: d.gpStore as "chrome", placement });
  } else if (d.gpTrack === "locale_switch" && LOCALES.includes(d.gpFrom ?? "") && LOCALES.includes(d.gpTo ?? "")) {
    track("locale_switch", { from: d.gpFrom as "en", to: d.gpTo as "ar" });
  }
}

/** Mounted once in the locale layout: delegated clicks, the page-load locale push, and section_view per page. */
export default function TrackListeners() {
  const pathname = usePathname();

  useEffect(() => {
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    // GTM's scroll_depth tag reads the locale from this push.
    pushDataLayer({ locale: document.documentElement.lang });
    if (typeof IntersectionObserver === "undefined") return;
    const seen = new Set<string>();
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        const id = (en.target as HTMLElement).dataset.gpSection;
        // Tall sections can never be 50% visible, so half a viewport of the section also counts.
        const half = en.intersectionRatio >= 0.5 || (en.intersectionRect?.height ?? 0) >= window.innerHeight / 2;
        if (!en.isIntersecting || !half || !id || seen.has(id)) continue;
        seen.add(id);
        track("section_view", { section_id: id });
      }
    }, { threshold: [0, 0.05, 0.1, 0.25, 0.5] });
    document.querySelectorAll("[data-gp-section]").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
