"use client";

import { useEffect } from "react";
import { t, type Locale } from "../../lib/i18n";
import { createScenes } from "./scenes";
import s from "./ScrollScenes.module.css";

/** Loops sleep when nothing moves; input wakes them and they run on for this grace (the mock's GP_LOOP/GP_WAKE). */
const QUIET_MS = 400;
const HERO_KICK_MS = 800;
const CUE_FIRST_MS = 1200;
const CUE_STOP_MS = 1500;
const WAKE_ON = ["scroll", "resize", "pointerdown", "keydown", "wheel", "touchmove"] as const;
const PINNED = ["how", "film", "spotpin", "print"];

/** The visitor's month on the receipt, Latin digits in both languages. */
export const receiptMonth = (locale: Locale, d = new Date()) =>
  d.toLocaleDateString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US", { month: "long", year: "numeric" });

/** Footer price bleeds off the bottom, never the sides: shrink long prices to the section width. */
function fitWord() {
  const wd = document.getElementById("word"), foot = document.getElementById("foot");
  if (!wd || !foot) return;
  wd.style.fontSize = "";
  const fs = parseFloat(getComputedStyle(wd).fontSize), room = foot.clientWidth - 40;
  if (wd.offsetWidth > room) wd.style.fontSize = (fs * room) / wd.offsetWidth + "px";
  const now = parseFloat(getComputedStyle(wd).fontSize);
  if (now) wd.style.bottom = -now * 0.29 + "px";
}

/**
 * The landing's scroll-driven motion, one island for the whole page (sections stay server components):
 * every scene in scenes.ts, the scroll cue, the rail's drag cursor, the receipt month and the footer price fit.
 * Reduced motion: every scene renders its end state (How still steps by scroll position, without movement).
 */
export default function ScrollScenes({ locale }: { locale: Locale }) {
  useEffect(() => {
    const rm = document.getElementById("rmonth");
    if (rm) rm.textContent = receiptMonth(locale);

    const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let quietUntil = 0, on = false, raf = 0;
    const run = () => {
      if (sc.frame() || performance.now() < quietUntil) raf = requestAnimationFrame(run);
      else on = false;
    };
    const wake = () => {
      quietUntil = performance.now() + QUIET_MS;
      if (!on) { on = true; raf = requestAnimationFrame(run); }
    };
    const sc = createScenes(reduce, wake);
    const refit = () => { sc.measure(); fitWord(); };
    refit();
    sc.frame();
    wake();
    WAKE_ON.forEach((e) => addEventListener(e, wake, { passive: true }));
    addEventListener("resize", refit);
    const fonts = typeof document.fonts === "object" ? document.fonts : null;
    fonts?.ready.then(refit);
    fonts?.addEventListener("loadingdone", refit);
    const kick = setTimeout(() => { sc.kickHero(); wake(); }, HERO_KICK_MS);

    // scroll cue: on at the top until the first scroll; after that, back on when the visitor stops for 1.5s inside a
    // pinned scene that is only part-way through. It never covers a control or the hero's match chips.
    const cue = document.getElementById("cue");
    let cueT: ReturnType<typeof setTimeout> | undefined;
    const midScene = () => PINNED.some((id) => {
      const e = document.getElementById(id);
      if (!e) return false;
      const r = e.getBoundingClientRect(), q = sc.prog(e, true);
      return r.top <= 0 && r.bottom >= innerHeight && q > 0.02 && q < 0.85;
    });
    const cueFree = () => {
      if (!cue || typeof document.elementFromPoint !== "function") return true;
      const r = cue.getBoundingClientRect(), y = r.top + r.height / 2;
      return ![r.left + 4, r.left + r.width / 2, r.right - 4].some((x) => document.elementFromPoint(x, y)?.closest("button,a,#tags"));
    };
    const cueCheck = () => cue?.classList.toggle("on", (scrollY < 10 || midScene()) && cueFree());
    const onScroll = () => { cue?.classList.remove("on"); clearTimeout(cueT); cueT = setTimeout(cueCheck, CUE_STOP_MS); };
    addEventListener("scroll", onScroll, { passive: true });
    const cueFirst = setTimeout(cueCheck, CUE_FIRST_MS);

    // drag rail: pointer drag on top of native scroll-snap, with a "Drag" cursor that follows the pointer (desktop)
    const tr = document.getElementById("track"), dc = document.getElementById("dragc");
    let down: { x: number; s: number } | null = null;
    const zoom = () => parseFloat(document.documentElement.style.getPropertyValue("--z")) || 1;
    const enter = () => dc?.classList.add("on");
    const leave = () => { dc?.classList.remove("on"); down = null; tr?.classList.remove("drag"); };
    const move = (e: PointerEvent) => {
      if (dc) { dc.style.left = e.clientX / zoom() + "px"; dc.style.top = e.clientY / zoom() + "px"; }
      if (down && tr) tr.scrollLeft = down.s - (e.clientX - down.x);
    };
    const press = (e: PointerEvent) => { if (!tr) return; down = { x: e.clientX, s: tr.scrollLeft }; tr.classList.add("drag"); };
    const release = () => { down = null; tr?.classList.remove("drag"); };
    tr?.addEventListener("pointerenter", enter);
    tr?.addEventListener("pointerleave", leave);
    tr?.addEventListener("pointermove", move);
    tr?.addEventListener("pointerdown", press);
    addEventListener("pointerup", release);

    return () => {
      cancelAnimationFrame(raf);
      sc.stop();
      [kick, cueT, cueFirst].forEach((x) => clearTimeout(x));
      WAKE_ON.forEach((e) => removeEventListener(e, wake));
      removeEventListener("resize", refit);
      removeEventListener("scroll", onScroll);
      fonts?.removeEventListener("loadingdone", refit);
      tr?.removeEventListener("pointerenter", enter);
      tr?.removeEventListener("pointerleave", leave);
      tr?.removeEventListener("pointermove", move);
      tr?.removeEventListener("pointerdown", press);
      removeEventListener("pointerup", release);
    };
  }, [locale]);

  return (
    <>
      <div className={s.cue} id="cue" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 5l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span>{t(locale, "web.landing.hero.scrollCue")}</span>
      </div>
      <div className={s.dragc} id="dragc" aria-hidden="true">{t(locale, "web.landing.rail.dragCue")}</div>
    </>
  );
}
