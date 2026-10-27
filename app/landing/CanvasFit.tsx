"use client";

import { useLayoutEffect } from "react";
import { fitCanvas } from "./canvas";

/**
 * The section under the top of the window and how far through it we are (0 to 1). Sections are the scenes' runways,
 * so this is the scene's progress; px would land somewhere else once the canvas zoom changes the page height.
 */
function anchor() {
  for (const el of document.querySelectorAll<HTMLElement>("[data-gp-section]")) {
    const r = el.getBoundingClientRect();
    if (r.top <= 0 && r.bottom > 0) return { id: el.dataset.gpSection!, at: -r.top / r.height };
  }
  return null;
}

/**
 * Refits the canvas on resize (keeping the visitor at the same place in the same scene, as the mock does), and on a
 * client-side navigation to the page (where the inline boot script never runs).
 */
export default function CanvasFit() {
  useLayoutEffect(() => {
    fitCanvas();
    // By the time `resize` fires the browser has already re-laid the page out and its scroll anchoring has moved the
    // visitor, so the place is tracked as they scroll (once per frame) and restored from the last one.
    let was = anchor(), raf = 0, width = innerWidth;
    const track = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { was = anchor(); }); };
    const refit = () => {
      fitCanvas();
      // the fit is width-driven: a height-only resize (a phone's URL bar showing or hiding mid-scroll) must not yank the page back to a stale anchor
      if (innerWidth === width) return;
      width = innerWidth;
      const el = was && document.querySelector<HTMLElement>(`[data-gp-section="${was.id}"]`);
      // "instant": the page smooth-scrolls, and a smoothed restore would chase the wrong place mid-resize
      if (el) { const r = el.getBoundingClientRect(); scrollTo({ top: scrollY + r.top + was!.at * r.height, behavior: "instant" }); }
    };
    window.addEventListener("scroll", track, { passive: true });
    window.addEventListener("resize", refit);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", track);
      window.removeEventListener("resize", refit);
    };
  }, []);
  return null;
}
