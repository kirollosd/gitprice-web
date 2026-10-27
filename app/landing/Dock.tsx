"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { env } from "../../lib/env";
import { t, type Locale } from "../../lib/i18n";
import { localeFromPath } from "../../lib/locale";
import BetaTag from "../components/BetaTag";
import StoreBadges from "../components/StoreBadges";
import WaitlistForm from "../components/WaitlistForm";
import GMark from "./GMark";
import { esc, html } from "./html";
import { formatMoney, useMoney } from "./money";
import s from "./Dock.module.css";

const K = "web.landing.dock.";
type Ctx = { isOpen: boolean; joined: boolean; open: (opener?: HTMLElement | null) => void; close: () => void; join: () => void };
const JoinCtx = createContext<Ctx>({ isOpen: false, joined: false, open: () => {}, close: () => {}, join: () => {} });

/**
 * The page's one waitlist form lives in the dock (constraints call 1): every Join button opens and focuses it.
 * Wraps the whole layout so the header CTA, the page's buttons and the dock share it.
 */
export function JoinProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [joined, setJoined] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const open = useCallback((el?: HTMLElement | null) => {
    // joined: the buttons stay, but a press lands on the confirmation (#dt, announced) instead of doing nothing
    if (joined) { document.getElementById("dt")?.focus({ preventScroll: true }); return; }
    opener.current = el ?? null;
    setOpen(true);
  }, [joined]);
  const close = useCallback(() => {
    setOpen(false);
    (opener.current ?? document.getElementById("dgo"))?.focus({ preventScroll: true });
  }, []);
  const join = useCallback(() => { setJoined(true); setOpen(false); }, []);
  // the scroll cue steps aside while the form is open (ScrollScenes.module.css)
  useEffect(() => {
    const d = document.documentElement.dataset;
    if (isOpen) d.gpJoin = "open";
    else delete d.gpJoin;
  }, [isOpen]);
  return <JoinCtx.Provider value={{ isOpen, joined, open, close, join }}>{children}</JoinCtx.Provider>;
}

/** Opens the dock's waitlist form (a no-op outside JoinProvider). */
export const useJoin = (): { open: (opener?: HTMLElement | null) => void } => ({ open: useContext(JoinCtx).open });

/**
 * A "Join the waitlist" button for pages that supply their own label (site header, menu sheet, pricing): it opens the
 * dock's form in place, like every other join button. Not for launch, where callers link to the Chrome store.
 * `opener` is who gets focus back when the form closes (default: the button itself).
 */
export function JoinCta({ label, className, placement, ctaId = "join_waitlist", opener, onOpen }: {
  label: string; className?: string; placement: string; ctaId?: string; opener?: () => HTMLElement | null; onOpen?: () => void;
}) {
  const { open } = useContext(JoinCtx);
  return (
    <button type="button" className={className} data-join="" data-gp-track="cta_click" data-gp-cta-id={ctaId} data-gp-placement={placement}
      onClick={(e) => { onOpen?.(); open(opener ? opener() : e.currentTarget); }}>
      {label}
    </button>
  );
}

const LABEL = { hero: "web.landing.hero.join", bottom: "web.landing.foot.join", nav: "web.landing.nav.join" } as const;

/** Every [data-join]: opens the dock form; after launch it is the Add to Chrome link (constraints call 2). */
export function JoinButton({ locale, placement, className }: { locale: Locale; placement: keyof typeof LABEL; className?: string }) {
  const { open, joined } = useContext(JoinCtx);
  if (env.launch) {
    return (
      <a className={className} href={env.chromeStoreUrl} data-gp-track="store_click" data-gp-store="chrome" data-gp-placement={placement}>
        {t(locale, "web.component.webStoreBadges.default.button.addToChrome.label")}
      </a>
    );
  }
  return (
    <button type="button" className={className} data-join="" data-gp-track="cta_click" data-gp-cta-id="join" data-gp-placement={placement} onClick={(e) => open(e.currentTarget)}>
      {t(locale, joined ? K + "joined" : LABEL[placement])}
    </button>
  );
}

// deepest section first: the dock names the one whose top has passed mid-screen; at the top it shows the price
const SECTIONS = [["foot", "foot"], ["rail", "rail"], ["alerts", "alerts"], ["rcpt", "print"], ["spot", "spot"], ["film", "film"], ["how", "how"]] as const;
type Msg = (typeof SECTIONS)[number][1] | null;
const MSG: Record<NonNullable<Msg>, string> = {
  foot: K + "foot", rail: K + "rail", alerts: K + "alerts", print: K + "print", spot: K + "spot", film: K + "film",
  how: "web.landing.how.panelSame", // the mock's "= Same product, another store" has no key yet; closest approved copy
};
const rect = (el: Element | null) => el?.getBoundingClientRect();
const under = (el: Element | null, y: number) => { const r = rect(el); return !!r && r.top <= y && r.bottom > y; };
/** Dark bands: the trap and the footer. */
const darkAt = (y: number) => under(document.querySelector("footer"), y) || under(document.querySelector("[data-dark]"), y);

function read(): { msg: Msg; from: number; best: number } {
  const h = innerHeight * 0.5, num = document.getElementById("num");
  const hit = SECTIONS.find(([id]) => { const r = rect(document.getElementById(id)); return !!r && r.top < h && r.bottom > 0; });
  return { msg: hit ? hit[1] : null, from: +(num?.dataset.from ?? 0), best: +(num?.dataset.best ?? 0) };
}

/**
 * The fixed dock (#dock), after <main>: the line for where you are, plus the waitlist (or, launched, Add to Chrome).
 * On the landing it comes in once the hero board has landed and stays (the mock's dockIn), and is always shown while
 * its form is open; on every other page it is simply there. Over a dark band it flips light (`dk`), and flips the header too.
 */
export default function Dock({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const home = localeFromPath(pathname ?? "/").rest === "/";
  const { isOpen, joined, open, close, join } = useContext(JoinCtx);
  const [view, setView] = useState<{ msg: Msg; from: number; best: number; dk: boolean; aside: boolean; landed: boolean }>({ msg: null, from: 0, best: 0, dk: false, aside: false, landed: false });
  const ref = useRef<HTMLDivElement>(null);
  const fmt = useMoney();

  useEffect(() => {
    const update = () => {
      const d = ref.current?.getBoundingClientRect();
      // site pages: only the dock itself flips over their always-dark footer
      if (!home) { const dk = !!d && darkAt(d.top + d.height / 2); setView((v) => v.dk === dk ? v : { ...v, dk }); return; }
      const header = document.querySelector("header");
      header?.toggleAttribute("data-dk", darkAt(60));
      header?.toggleAttribute("data-solid", scrollY > 40);
      // short phones: the pinned lineup's own buttons sit where the dock would, so the dock steps aside
      const room = rect(document.getElementById("room")), bar = rect(document.getElementById("verdict")?.parentElement ?? null);
      const aside = document.documentElement.classList.contains("lp-m") && !!room && !!bar
        && room.top <= 1 && room.bottom >= innerHeight - 1 && bar.bottom > innerHeight - 100;
      // the mock's dockIn: the dock comes in once the hero board has landed, and stays (scenes.ts sets data-landed)
      const landed = !!document.getElementById("num")?.hasAttribute("data-landed");
      const next = { ...read(), dk: !!d && darkAt(d.top + d.height / 2), aside, landed };
      setView((v) => (Object.keys(next) as (keyof typeof next)[]).every((k) => v[k] === next[k]) ? v : next);
    };
    update();
    // one layout pass per frame, however many scroll events arrive
    let raf = 0;
    const onFrame = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    // gp:hero: the board landed (or replays for a new product); gp:product: the sections were rebuilt
    const EVENTS = ["scroll", "resize", "gp:hero", "gp:product"];
    EVENTS.forEach((e) => addEventListener(e, onFrame, { passive: true }));
    return () => {
      cancelAnimationFrame(raf);
      EVENTS.forEach((e) => removeEventListener(e, onFrame));
      document.querySelector("header")?.removeAttribute("data-dk");
      document.querySelector("header")?.removeAttribute("data-solid");
    };
  }, [home, pathname]);

  // the footers reserve this much page end (--gp-dock-h), so the dock never covers the last row however tall it wraps
  useEffect(() => {
    const el = ref.current, root = document.documentElement.style;
    if (!el || typeof ResizeObserver !== "function") return;
    const ro = new ResizeObserver(() => root.setProperty("--gp-dock-h", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => { ro.disconnect(); root.removeProperty("--gp-dock-h"); };
  }, []);

  // the form takes focus as it opens
  useEffect(() => {
    if (isOpen) ref.current?.querySelector<HTMLInputElement>('input[type="email"]')?.focus({ preventScroll: true });
  }, [isOpen]);
  // Esc closes the open form wherever focus is, and hands focus back to the opener; a press another popup (menu sheet, language menu) already used is left alone
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !e.defaultPrevented) close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);
  useEffect(() => {
    if (joined) document.getElementById("dt")?.focus({ preventScroll: true });
  }, [joined]);

  // site pages have no hero to wait for: the dock is simply there
  const shown = !home || isOpen || (view.landed && !view.aside);
  const less = fmt(view.from - view.best, 2).replace(".00 ", " ");
  const line = joined ? esc(t(locale, K + "done"))
    : !home ? esc(t(locale, K + "foot"))
    : view.msg ? esc(t(locale, MSG[view.msg]))
    : html(locale, K + "elsewhere", {}, { price: `<bdi dir="ltr">${esc(formatMoney(view.best))}</bdi>`, less: `<bdi dir="ltr">${esc(less)}</bdi>` }).__html;
  const cls = [s.dock, shown && "in", view.dk && "dk", isOpen && "join", joined && "done"].filter(Boolean).join(" ");
  return (
    <div ref={ref} className={cls} id="dock" {...(isOpen && { role: "group", "aria-label": t(locale, K + "join") })}>
      <GMark className={s.eq} state="idle" label="" />
      {!isOpen && <span className={s.t} id="dt" tabIndex={joined ? -1 : undefined} aria-live={joined ? "polite" : undefined} dangerouslySetInnerHTML={{ __html: line }} />}
      <BetaTag locale={locale} />
      {env.launch ? (
        <StoreBadges locale={locale} placement="dock" />
      ) : isOpen ? (
        <div className={s.wl}>
          <WaitlistForm locale={locale} audience="shopper" placement="dock" label={t(locale, K + "submit")} onJoined={join} />
          <button type="button" className={s.x} id="wlx" aria-label={t(locale, K + "close")} onClick={close}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
        </div>
      ) : !joined && (
        <button type="button" className={s.go} id="dgo" onClick={(e) => open(e.currentTarget)}>{t(locale, K + "join")}</button>
      )}
    </div>
  );
}
