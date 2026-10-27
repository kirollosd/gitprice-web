"use client";

import { useEffect, useRef, useState } from "react";
import s from "./GMark.module.css";

export type GState = "chk" | "same" | "ne" | "none" | "idle";

/** Delay between a mark scrolling into view and it settling (it "checks" first), and the morph length. */
const CHECK_MS = 900;
const MORPH_MS = 550;
// = and ≠: the g's flag and smile straighten into the two bars. Tweened here, never with CSS `d` (Safari can't).
const D = {
  flag: [[0, -71.5, 107.6, -71.5], [-80, 18, 80, 18]],
  smile: [[-62, 158, 0, 214, 62, 158], [-80, 98, 0, 98, 80, 98]],
} as const;
const dStr = {
  flag: (a: number[]) => `M${a[0]} ${a[1]}L${a[2]} ${a[3]}`,
  smile: (a: number[]) => `M${a[0]} ${a[1]}Q${a[2]} ${a[3]} ${a[4]} ${a[5]}`,
};
const shape = (n: keyof typeof D, k: number) => dStr[n](D[n][0].map((v, i) => v + (D[n][1][i] - v) * k));
const out = (k: number) => 1 - Math.pow(1 - k, 4);
/** 1 = the bars of = and ≠, 0 = the g. */
const barsOf = (g: GState) => (g === "same" || g === "ne" ? 1 : 0);
const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The GitPrice mark for every result sign (= ≠ ?): an orbiting g while it checks, then it unwinds into the result
 * (same, ne, or a dim g for none); `idle` is the dock's slow loop. `settleOnView` holds `chk` until the mark has been
 * on screen for 900 ms; reduced motion settles at once. `label` is the accessible name (words); "" = decorative.
 * `className` carries the section's round chip styling.
 */
export default function GMark({ state, settleOnView, label, className }: { state: GState; settleOnView?: boolean; label: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [g, setG] = useState<GState>(settleOnView ? "chk" : state);
  const k = useRef(barsOf(g));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const morph = (to: number, instant: boolean) => {
      const paths = { flag: el.querySelector("[data-p=flag]")!, smile: el.querySelector("[data-p=smile]")! };
      const from = k.current, t0 = performance.now();
      const step = (now: number) => {
        const e = instant ? 1 : out(Math.min(1, (now - t0) / MORPH_MS));
        k.current = from + (to - from) * e;
        for (const n of ["flag", "smile"] as const) paths[n].setAttribute("d", shape(n, k.current));
        if (e < 1) raf = requestAnimationFrame(step);
      };
      if (instant || from === to) step(t0);
      else raf = requestAnimationFrame(step);
    };
    const settle = (instant: boolean) => {
      setG(state);
      morph(barsOf(state), instant);
    };
    const instant = reduced();
    if (!settleOnView || state === "chk" || state === "idle" || instant) {
      settle(instant || !settleOnView);
      return () => cancelAnimationFrame(raf);
    }
    if (typeof IntersectionObserver !== "function") {
      settle(true);
      return;
    }
    setG("chk");
    const io = new IntersectionObserver((es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      io.disconnect();
      timer = setTimeout(() => settle(false), CHECK_MS);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [state, settleOnView]);

  const k0 = barsOf(settleOnView ? "chk" : state);
  return (
    <span
      ref={ref}
      className={`${className ?? ""} ${s.gx}`}
      data-g={g}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="-150 -110 300 320" aria-hidden="true">
        <path data-p="ring" className={s.ring} d="M0 -71.5A71.5 71.5 0 1 1 -.01 -71.5" />
        <path data-p="flag" d={shape("flag", k0)} />
        <path data-p="smile" d={shape("smile", k0)} />
        <path data-p="slash" className={s.slash} d="M60 -40L-60 160" />
      </svg>
    </span>
  );
}
