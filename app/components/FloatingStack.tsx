"use client";

import { useEffect, useRef } from "react";
import styles from "./FloatingStack.module.css";

/**
 * One fixed bottom layer so the locale suggestion and cookie notice stack instead of overlapping. Its height is
 * published as --gp-stack-h (0 while empty) so the landing's fixed dock can sit above whatever is showing.
 */
export default function FloatingStack({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const root = document.documentElement.style;
    if (!el || typeof ResizeObserver !== "function") return;
    const ro = new ResizeObserver(() => root.setProperty("--gp-stack-h", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => { ro.disconnect(); root.removeProperty("--gp-stack-h"); };
  }, []);
  return <div ref={ref} className={styles.stack}>{children}</div>;
}
