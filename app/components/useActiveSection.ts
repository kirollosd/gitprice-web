"use client";

import { useEffect, useState } from "react";

/**
 * Scroll-spy for the header links: the id of the section that crosses the viewport's centre line, or null (hero, footer,
 * or a page without these sections). With nested or touching sections the later one in `ids` wins, so only one is active.
 * The landing rebuilds its sections when the product changes (LandingBody fires gp:product), so the observer is rebuilt then.
 */
export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (typeof IntersectionObserver !== "function") return;
    let io: IntersectionObserver | undefined;
    const watch = () => {
      io?.disconnect();
      const seen = new Set<string>();
      // a zero-height root on the centre line: a section is "in view" while it covers the middle of the viewport
      io = new IntersectionObserver((es) => {
        es.forEach((e) => (e.isIntersecting ? seen.add(e.target.id) : seen.delete(e.target.id)));
        setActive([...ids].reverse().find((id) => seen.has(id)) ?? null);
      }, { rootMargin: "-50% 0px -50% 0px" });
      ids.forEach((id) => { const el = document.getElementById(id); if (el) io!.observe(el); });
    };
    watch();
    addEventListener("gp:product", watch);
    return () => { removeEventListener("gp:product", watch); io?.disconnect(); };
  }, [ids]);
  return active;
}
