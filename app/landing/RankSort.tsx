"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { t, type Locale } from "../../lib/i18n";
import { nb } from "./html";
import b from "./base.module.css";
import { Price } from "./Price";
import { StoreText } from "./StoreMark";
import type { RankRow } from "./Trap";
import s from "./Trap.module.css";

const K = "web.landing.trap.";
/** The ranking flips to GitPrice's order this long after it scrolls into view. */
const FLIP_MS = 900;
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The trap's toggle: a plain price sort against GitPrice's exact-first order. Rows move, they don't swap: each is
 * stacked at its measured height (rows wrap on narrow screens). The top row gets `first`, the winner `w`,
 * look-alikes in GitPrice order `x`. Static paint (no JS) is the price order, as server-rendered.
 */
export default function RankSort({ rows, locale }: { rows: RankRow[]; locale: Locale }) {
  const [gp, setGp] = useState(false);
  const rank = useRef<HTMLDivElement>(null);
  const stopAuto = useRef<() => void>(() => {});
  /** The visitor's own choice wins over the scroll-in flip, pending or not yet armed. */
  const choose = (v: boolean) => { stopAuto.current(); setGp(v); };

  useIsoLayoutEffect(() => {
    const box = rank.current;
    if (!box) return;
    const sort = () => {
      const els = [...box.children] as HTMLElement[];
      // rows arrive cheapest first; GitPrice keeps that order but puts every exact match first
      const order = rows.map((_, i) => i).sort((a, b) => (gp ? Number(!rows[a].exact) - Number(!rows[b].exact) || a - b : a - b));
      let y = 0;
      order.forEach((i, pos) => {
        const el = els[i];
        el.style.transform = `translateY(${y}px)`;
        y += el.offsetHeight;
        el.classList.toggle("first", pos === 0);
        el.classList.toggle("w", gp ? pos === 0 : i === 0);
        el.classList.toggle("x", gp && !rows[i].exact);
      });
      box.style.position = "relative";
      els.forEach((el) => { el.style.position = "absolute"; el.style.left = el.style.right = "0"; });
      box.style.height = y + "px";
    };
    sort();
    addEventListener("resize", sort);
    const fonts = typeof document.fonts === "object" ? document.fonts : null;
    let live = true;
    fonts?.ready.then(() => { if (live) sort(); });
    return () => { live = false; removeEventListener("resize", sort); };
  }, [gp, rows]);

  // scroll it in: it flips to GitPrice order once the ranking is well in view
  useEffect(() => {
    const box = rank.current;
    if (!box || typeof IntersectionObserver !== "function") return;
    const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver((es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      io.disconnect();
      timer = setTimeout(() => setGp(true), reduce ? 0 : FLIP_MS);
    }, { threshold: 0.6 });
    io.observe(box);
    stopAuto.current = () => { io.disconnect(); clearTimeout(timer); };
    return stopAuto.current;
  }, []);

  return (
    <div className={s.rank}>
      <div className={`${b.seg} ${s.tg}`} role="group">
        <button type="button" id="tgAll" className={gp ? undefined : "on"} aria-pressed={!gp} onClick={() => choose(false)}>{t(locale, K + "byPrice")}</button>
        <button type="button" id="tgGp" className={gp ? "on" : undefined} aria-pressed={gp} onClick={() => choose(true)}>{t(locale, K + "byGitPrice")}</button>
      </div>
      <div id="rank" ref={rank}>
        {rows.map((r, i) => (
          <div key={r.label + r.price} className={`${s.r} ${i === 0 ? "first w" : ""}`} data-exact={r.exact ? "" : undefined}>
            <span><bdi><StoreText label={nb(r.label)} locale={locale} /></bdi>{r.why && <em className={b.chip}><span aria-hidden="true">≠ </span>{r.why}</em>}</span>
            <b><Price v={r.price} /></b>
          </div>
        ))}
      </div>
    </div>
  );
}
