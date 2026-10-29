"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { t, type Locale } from "../../lib/i18n";
import GMark from "./GMark";
import { esc, html } from "./html";
import { useMoney } from "./money";
import type { Product } from "./products";
import s from "./Alerts.module.css";

const K = "web.landing.alerts.";
const RULES = [["to", "ruleTo"], ["any", "ruleAny"], ["rise", "ruleUp"]] as const;
type Rule = (typeof RULES)[number][0];
const KEYS: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 5, PageDown: -5 };
/** Home and End jump to the ends of the range. */
const ENDS = ["Home", "End"];
/** The first-view sweep: how long, and how long after the chart is half in view. */
const DEMO_MS = 3000, DEMO_WAIT = 400;
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const isPhone = () => document.documentElement.classList.contains("lp-m");

/**
 * 3b · alerts, ported from combo.html: the dashed line is a slider (role="slider", arrows nudge, page keys jump,
 * drag on desktop, tap on phones so the chart still scrolls). Dots that would fire light up; the toast says when.
 * On first view the line sweeps up, down and back to the example alert.
 */
export default function AlertSlider({ locale, product: P }: { locale: Locale; product: Product }) {
  const WK = P.weeks;
  const lo = Math.min(...WK), hi = Math.max(...WK), pad = (hi - lo) * 0.3, ylo = lo - pad, yhi = hi + pad * 0.6;
  const min = ylo + 10, max = yhi - 10;
  const clamp = (v: number) => Math.round(Math.min(max, Math.max(min, v)));
  const [rule, setRule] = useState<Rule>("to");
  const [th, setTh] = useState(P.alert);
  const [size, setSize] = useState({ w: 800, h: 380 });
  const fmt = useMoney();
  const svg = useRef<SVGSVGElement>(null), toast = useRef<HTMLDivElement>(null), demo = useRef(0), wait = useRef<ReturnType<typeof setTimeout>>(undefined), drag = useRef(false);

  const { w: CW, h: CH } = size;
  const cy = (v: number) => CH - ((v - ylo) / (yhi - ylo)) * CH, cx = (i: number) => (i / (WK.length - 1)) * CW;
  const hit = WK.map((v, i) => (rule === "to" ? v <= th : rule === "rise" ? v >= th && i > 0 : i > 0 && v < WK[i - 1]));
  const first = hit.indexOf(true), line = rule !== "any";
  const ttKey = first < 0 ? "none" : rule === "any" ? "anyDrops" : rule === "to" ? "wouldDrop" : "wouldRise";
  const ttVars = { count: hit.filter(Boolean).length, week: first + 1 };
  const amount = first < 0 ? "" : fmt(WK[first], 2);
  const tt = html(locale, K + ttKey, ttVars, { price: `<bdi dir="ltr">${esc(amount)}</bdi>` });
  // the same line as plain text, for the slider's valuetext and the toast's pop
  const ttText = t(locale, K + ttKey, { ...ttVars, price: amount });

  const stopDemo = () => { clearTimeout(wait.current); cancelAnimationFrame(demo.current); demo.current = 0; };
  const fromPointer = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (r.height) setTh(clamp(ylo + ((CH - ((e.clientY - r.top) / r.height) * CH) / CH) * (yhi - ylo)));
  };

  // the drawing follows the svg's real size (its viewBox is screen px, so strokes and dots stay round)
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const fit = () => setSize({ w: el.clientWidth || 800, h: el.clientHeight || 380 });
    fit();
    // width only: a phone's URL bar showing or hiding mid-scroll must not redraw the chart
    let width = innerWidth;
    const onResize = () => { if (innerWidth !== width) { width = innerWidth; fit(); } };
    addEventListener("resize", onResize);
    return () => removeEventListener("resize", onResize);
  }, []);

  // the toast pops when what it says changes, but not on every step of a sweep or drag (it would flicker)
  const said = useRef(ttText);
  useEffect(() => {
    const el = toast.current;
    if (!el || said.current === ttText) return;
    said.current = ttText;
    if (demo.current || drag.current) return;
    el.classList.add("pop");
    let id = requestAnimationFrame(() => { id = requestAnimationFrame(() => el.classList.remove("pop")); });
    return () => cancelAnimationFrame(id);
  }, [ttText]);

  // first view: the sweep shows the line moves before the visitor tries it
  useEffect(() => {
    const chart = svg.current?.parentElement;
    if (!chart || reduced() || typeof IntersectionObserver !== "function") return;
    const sweep = () => {
      const keys = [P.alert, hi - (hi - lo) * 0.05, lo + (hi - lo) * 0.12, P.alert], t0 = performance.now();
      const step = (now: number) => {
        const u = Math.min(1, (now - t0) / DEMO_MS) * (keys.length - 1), k = Math.min(keys.length - 2, Math.floor(u));
        setTh(Math.round(keys[k] + (keys[k + 1] - keys[k]) * ease(u - k)));
        demo.current = u < keys.length - 1 ? requestAnimationFrame(step) : 0;
      };
      demo.current = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      io.disconnect();
      wait.current = setTimeout(sweep, DEMO_WAIT);
    }, { threshold: 0.5 });
    io.observe(chart);
    return () => { io.disconnect(); stopDemo(); };
  }, [P.alert, hi, lo]);

  const pick = (r: Rule) => {
    stopDemo();
    setRule(r);
    if (r === "rise") setTh(Math.round(hi * 0.995));
    if (r === "to") setTh(P.alert);
  };

  return (
    <div className={s.aw}>
      <div className={s.rules} id="rules">
        {RULES.map(([r, k]) => (
          <button key={r} type="button" data-r={r} className={r === rule ? "on" : undefined} aria-pressed={r === rule} onClick={() => pick(r)}>
            {t(locale, K + k)}
            <small>{t(locale, K + k + "Hint")}</small>
          </button>
        ))}
      </div>
      <div className={s.chart} id="chart">
        <div className={s.toast} id="toast" ref={toast}>
          <GMark className={s.eq} state="same" settleOnView label="" />
          <div>
            <small>{t(locale, K + "toast")}</small>
            <div id="tt" dangerouslySetInnerHTML={tt} />
          </div>
        </div>
        <svg
          ref={svg}
          id="csvg"
          className={s.csvg}
          viewBox={`0 0 ${CW} ${CH}`}
          tabIndex={0}
          role="slider"
          aria-label={t(locale, K + "sliderLabel")}
          aria-valuemin={Math.round(min)}
          aria-valuemax={Math.round(max)}
          aria-valuenow={th}
          aria-valuetext={line ? fmt(th, 2) : ttText}
          aria-disabled={line ? undefined : true}
          onKeyDown={(e) => {
            const k = KEYS[e.key], end = ENDS.indexOf(e.key);
            if ((!k && end < 0) || !line) return;
            e.preventDefault();
            stopDemo();
            if (end >= 0) return setTh(end ? Math.round(max) : Math.round(min));
            setTh((v) => clamp(v + k * Math.max(1, (yhi - ylo) / 50)));
          }}
          onPointerDown={(e) => {
            stopDemo();
            if (!line || isPhone()) return;
            drag.current = true;
            e.currentTarget.setPointerCapture?.(e.pointerId);
            fromPointer(e);
          }}
          onPointerMove={(e) => { if (drag.current) fromPointer(e); }}
          onPointerUp={() => { drag.current = false; }}
          onPointerCancel={() => { drag.current = false; }}
          onClick={(e) => { stopDemo(); if (line && isPhone()) fromPointer(e as unknown as PointerEvent<SVGSVGElement>); }}
        >
          <path d={WK.map((v, i) => `${i ? "L" : "M"}${cx(i)} ${cy(v)}`).join(" ")} fill="none" stroke="var(--gp-web-ink)" strokeWidth="3" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {line && <line x1="0" x2={CW} y1={cy(th)} y2={cy(th)} stroke="var(--gp-web-fill)" strokeWidth="2.5" strokeDasharray="8 8" vectorEffect="non-scaling-stroke" />}
          {WK.map((v, i) => (
            <circle key={i} cx={cx(i)} cy={cy(v)} r={hit[i] ? 9 : 5} fill={hit[i] ? "var(--gp-web-fill)" : "var(--gp-web-raised)"} stroke={hit[i] ? "var(--gp-web-fill)" : "var(--gp-web-ink)"} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
        {line && (
          <div className="th-label" aria-hidden="true" style={{ position: "absolute", left: 34, top: 26 + cy(th) - 34, background: "var(--gp-web-fill)", color: "var(--gp-web-on-fill)", padding: "4px 10px", borderRadius: 8, pointerEvents: "none" }}>
            <bdi dir="ltr">{(rule === "to" ? "≤ " : "≥ ") + fmt(th, 2)}</bdi>
          </div>
        )}
        <div className={s.hint} id="ahint">
          <span className={s.drag}>{t(locale, K + "hintDrag")}</span>
          <span className={s.tap}>{t(locale, K + "hintTap")}</span>
        </div>
      </div>
    </div>
  );
}
