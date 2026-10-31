"use client";

import { useEffect } from "react";
import { t, type Locale } from "../../lib/i18n";
import { subscribeMoney } from "./money";
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
 * every scene in scenes.ts, the scroll cue, the receipt month and the footer price fit.
 * Reduced motion: every scene renders its end state (How still steps by scroll position, without movement).
 */
export default function ScrollScenes({ locale }: { locale: Locale }) {
  useEffect(() => {
    const rm = document.getElementById("rmonth");
    if (rm) rm.textContent = receiptMonth(locale);

    const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let quietUntil = 0, on = false, raf = 0, lastY = scrollY;
    const run = () => {
      // some in-app browsers (Chrome and the Google app on iOS) hold scroll events back during a flick: moving is what keeps the loop on
      if (scrollY !== lastY) { lastY = scrollY; quietUntil = performance.now() + QUIET_MS; }
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
    // width only: a phone's URL bar showing or hiding mid-scroll is a height-only resize and must not re-measure every scene
    let width = innerWidth;
    const onResize = () => { if (innerWidth !== width) { width = innerWidth; refit(); } };
    addEventListener("resize", onResize);
    const fonts = typeof document.fonts === "object" ? document.fonts : null;
    fonts?.ready.then(refit);
    fonts?.addEventListener("loadingdone", refit);
    const kick = setTimeout(() => { sc.kickHero(); wake(); }, HERO_KICK_MS);
    // ProductPicker swapped the content (gp:product), or Rates the currency: re-measure and refit after React commits
    const onProduct = () => { sc.reset(); refit(); wake(); };
    addEventListener("gp:product", onProduct);
    let refitRaf = 0;
    const unMoney = subscribeMoney(() => { cancelAnimationFrame(refitRaf); refitRaf = requestAnimationFrame(() => { refit(); wake(); }); });

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
    // a notice (cookie, locale) opening or closing changes what covers the cue: check again once it has settled
    const stack = new MutationObserver(() => { clearTimeout(cueT); cueT = setTimeout(cueCheck, CUE_FIRST_MS); });
    stack.observe(document.documentElement, { attributes: true, attributeFilter: ["data-gp-stack"] });

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(refitRaf);
      unMoney();
      removeEventListener("gp:product", onProduct);
      sc.stop();
      [kick, cueT, cueFirst].forEach((x) => clearTimeout(x));
      WAKE_ON.forEach((e) => removeEventListener(e, wake));
      removeEventListener("resize", onResize);
      removeEventListener("scroll", onScroll);
      stack.disconnect();
      fonts?.removeEventListener("loadingdone", refit);
    };
  }, [locale]);

  return (
    <>
      <div className={s.cue} id="cue" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 5l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span>{t(locale, "web.landing.hero.scrollCue")}</span>
      </div>
    </>
  );
}
