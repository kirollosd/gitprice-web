"use client";

import { useEffect, useRef } from "react";
import styles from "./FloatingStack.module.css";

/**
 * One fixed bottom layer so the locale suggestion and cookie notice stack instead of overlapping. Its height is
 * published as --gp-stack-h (0 while empty) so the footers can leave room for it. The landing's dock never moves for it:
 * the stack sits above the dock instead (FloatingStack.module.css).
 */
export default function FloatingStack({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const root = document.documentElement.style;
    if (!el || typeof ResizeObserver !== "function") return;
    const ro = new ResizeObserver(() => {
      root.setProperty("--gp-stack-h", `${el.offsetHeight}px`);
      // html[data-gp-stack] marks "a notice is showing" (the scroll cue re-checks what covers it when it flips)
      if (el.childElementCount === 0) delete document.documentElement.dataset.gpStack;
      else document.documentElement.dataset.gpStack = "";
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.removeProperty("--gp-stack-h");
      delete document.documentElement.dataset.gpStack;
    };
  }, []);
  return <div ref={ref} className={styles.stack}>{children}</div>;
}
