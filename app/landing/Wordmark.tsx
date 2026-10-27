"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import { t, type Locale } from "../../lib/i18n";
import { LOGO_PATHS, LOGO_VIEWBOX } from "./logo-paths";
import s from "./Wordmark.module.css";

/** The logo's 21 paths as the letters g·i·t·p·r·i·c·e, for the price-board entry. */
const GROUPS = [[0, 3], [3, 5], [5, 8], [8, 11], [11, 14], [14, 16], [16, 17], [17, 21]] as const;
// arm before first paint on the client (no flash of the resting logo); plain effect on the server
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Restart the entry: drop to the armed state, force a style flush so the animation restarts, then play. */
export function playBoard(svg: SVGSVGElement) {
  svg.dataset.board = "";
  void svg.getBoundingClientRect();
  svg.dataset.board = "go";
}

/**
 * Header wordmark: the existing logo, inline so its letters can flip up like the hero price board.
 * Plays on mount and again each time #foot comes into view. Reduced motion: a still logo (no data-board at all).
 * Static paint (and no JS) is the plain logo; data-board="" arms it, "go" plays it.
 */
export default function Wordmark({ locale, href, className }: { locale: Locale; href?: string; className?: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useIsoLayoutEffect(() => {
    const svg = ref.current;
    if (!svg || typeof matchMedia !== "function" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    playBoard(svg);
    const foot = document.getElementById("foot");
    if (!foot || typeof IntersectionObserver !== "function") return;
    let seen = false;
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting && !seen) playBoard(svg);
      seen = e.isIntersecting;
    }), { threshold: 0.3 });
    io.observe(foot);
    return () => io.disconnect();
  }, []);

  return (
    <Link
      href={href ?? (locale === "ar" ? "/ar" : "/")}
      className={`${s.root} hit-target ${className ?? ""}`}
      aria-label={t(locale, "web.component.webNav.a11y.label.home")}
    >
      <svg ref={ref} className={s.logo} viewBox={LOGO_VIEWBOX} aria-hidden="true" focusable="false">
        {GROUPS.map(([a, b], i) => (
          <g key={i} className={s.L} style={{ "--i": i } as CSSProperties}>
            {LOGO_PATHS.slice(a, b).map(([d, eo], j) => <path key={j} d={d} fillRule={eo ? "evenodd" : undefined} />)}
          </g>
        ))}
      </svg>
    </Link>
  );
}
