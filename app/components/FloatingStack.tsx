"use client";

import { useEffect, useRef } from "react";
import styles from "./FloatingStack.module.css";

/**
 * One fixed bottom layer so the locale suggestion and cookie notice stack instead of overlapping. Its height is
 * published as --gp-stack-h (0 while empty) so the landing's fixed dock can sit above whatever is showing. On a desktop
 * the cookie notice is a card at the inline start, so the dock may sit beside it instead: --gp-stack-w is how far
 * the stack reaches in from that edge, and html[data-gp-stack] is "side" when only such cards show, "full" otherwise.
 */
const SIDE_MAX = 480;
export default function FloatingStack({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const root = document.documentElement.style;
    if (!el || typeof ResizeObserver !== "function") return;
    const ro = new ResizeObserver(() => {
      root.setProperty("--gp-stack-h", `${el.offsetHeight}px`);
      const rtl = document.documentElement.dir === "rtl";
      const reach = Math.max(0, ...[...el.children].map((c) => {
        const r = c.getBoundingClientRect();
        return rtl ? el.clientWidth - r.left : r.right;
      }));
      root.setProperty("--gp-stack-w", `${reach}px`);
      const d = document.documentElement.dataset;
      if (el.childElementCount === 0) delete d.gpStack;
      else d.gpStack = reach <= SIDE_MAX ? "side" : "full";
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.removeProperty("--gp-stack-h");
      root.removeProperty("--gp-stack-w");
      delete document.documentElement.dataset.gpStack;
    };
  }, []);
  return <div ref={ref} className={styles.stack}>{children}</div>;
}
