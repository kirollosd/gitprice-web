"use client";

import { useEffect } from "react";
import { t, type Locale } from "../../lib/i18n";
import { effectiveTheme } from "../components/ThemeToggle";

const K = "web.landing.film.";
const PAUSE = "M3 2h3v10H3zM8 2h3v10H8z", PLAY = "M3 1.5l9 5.5-9 5.5z";
const seg = (x: number, a: number, b: number) => Math.min(1, Math.max(0, (x - a) / (b - a)));

/**
 * The film's behaviour, ported from combo.html (renders nothing; binds to Film's #vid and #chap). Nothing loads
 * until #film is a quarter in view; then the cut for this product, canvas (-m on phones, 4:5) and theme
 * (coral = dark, coral-light = light) plays while on screen. A theme flip swaps the source. A missing phone cut
 * falls back to 16:9 (#fframe[data-nocut]). A pause the visitor chose survives scrolling away and back.
 * Reduced motion: native controls, no autoplay.
 */
export default function DemoVideo({ id, locale }: { id: string; locale: Locale }) {
  useEffect(() => {
    const vid = document.getElementById("vid") as HTMLVideoElement | null;
    const film = document.getElementById("film"), frame = document.getElementById("fframe");
    const pp = document.getElementById("vpp"), ppi = document.getElementById("vppi");
    const chs = [...(document.getElementById("chap")?.querySelectorAll<HTMLButtonElement>("[data-t]") ?? [])];
    if (!vid || !film) return;
    const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let inView = false, held = false, noCut = false, loaded = "", raf = 0;
    const play = () => { vid.play()?.catch(() => {}); };

    const src = () => {
      const cut = document.documentElement.classList.contains("lp-m") && !noCut ? "-m" : "";
      const base = `/media/demo-${id}${cut}-${effectiveTheme() === "dark" ? "coral" : "coral-light"}`;
      if (base === loaded) return;
      loaded = base;
      vid.poster = base + "-poster.jpg";
      vid.src = base + ".mp4";
      if (inView && !held && !reduce) play();
    };
    const onError = () => {
      if (noCut || !loaded.includes("-m-")) return;
      noCut = true;
      frame?.setAttribute("data-nocut", "");
      src();
    };

    // chapters: the one playing is `on`, its <i> fills with progress
    const progress = () => {
      const now = vid.currentTime || 0, d = vid.duration || 15;
      chs.forEach((b, i) => {
        const a = +(b.dataset.t ?? 0), z = chs[i + 1] ? +(chs[i + 1].dataset.t ?? d) : d, on = now >= a && now < z;
        b.classList.toggle("on", on);
        const bar = b.querySelector("i");
        if (bar) bar.style.width = (on ? seg(now, a, z) : now >= z ? 1 : 0) * 100 + "%";
      });
      raf = vid.paused ? 0 : requestAnimationFrame(progress);
    };
    const sync = () => {
      const on = !vid.paused;
      ppi?.setAttribute("d", on ? PAUSE : PLAY);
      pp?.setAttribute("aria-label", t(locale, K + (on ? "pause" : "play")));
      cancelAnimationFrame(raf);
      progress();
    };
    const onPp = () => { held = !vid.paused; if (held) vid.pause(); else play(); };
    const seeks = chs.map((b) => {
      const go = () => { held = false; if (!loaded) src(); vid.currentTime = +(b.dataset.t ?? 0); play(); };
      b.addEventListener("click", go);
      return () => b.removeEventListener("click", go);
    });

    if (reduce) vid.controls = true;
    // posters load only once the film is near, not with the first screen (LCP bandwidth)
    let near: IntersectionObserver | null = null;
    near = typeof IntersectionObserver === "function" ? new IntersectionObserver((es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      near?.disconnect();
      const p = (cut: string, look: string) => `url(/media/demo-${id}${cut}-${look}-poster.jpg)`;
      frame?.style.setProperty("--pl", p("", "coral-light")); frame?.style.setProperty("--pd", p("", "coral"));
      frame?.style.setProperty("--pml", p("-m", "coral-light")); frame?.style.setProperty("--pmd", p("-m", "coral"));
    }, { rootMargin: "100% 0px" }) : null;
    near?.observe(film);
    const io = typeof IntersectionObserver === "function" ? new IntersectionObserver((es) => es.forEach((e) => {
      inView = e.isIntersecting;
      if (inView) src();
      if (reduce) return;
      if (inView && !held) play(); else vid.pause();
    }), { threshold: 0.25 }) : null;
    io?.observe(film);

    // the theme in effect: data-theme on <html>, else the OS
    const swap = () => { if (loaded) src(); };
    const mo = new MutationObserver(swap);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : null;
    mq?.addEventListener?.("change", swap);

    vid.addEventListener("error", onError);
    vid.addEventListener("play", sync);
    vid.addEventListener("pause", sync);
    pp?.addEventListener("click", onPp);
    sync();
    return () => {
      io?.disconnect(); near?.disconnect(); mo.disconnect(); mq?.removeEventListener?.("change", swap);
      vid.removeEventListener("error", onError); vid.removeEventListener("play", sync); vid.removeEventListener("pause", sync);
      pp?.removeEventListener("click", onPp); seeks.forEach((off) => off());
      cancelAnimationFrame(raf);
    };
  }, [id, locale]);
  return null;
}
