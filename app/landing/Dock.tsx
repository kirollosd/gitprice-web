"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { env } from "../../lib/env";
import { t, type Locale } from "../../lib/i18n";
import { localeFromPath } from "../../lib/locale";
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
    if (joined) return;
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
const darkAt = (y: number) => under(document.getElementById("foot"), y) || under(document.querySelector("[data-dark]"), y);

function read(): { msg: Msg; from: number; best: number } {
  const h = innerHeight * 0.5, num = document.getElementById("num");
  const hit = SECTIONS.find(([id]) => { const r = rect(document.getElementById(id)); return !!r && r.top < h && r.bottom > 0; });
  return { msg: hit ? hit[1] : null, from: +(num?.dataset.from ?? 0), best: +(num?.dataset.best ?? 0) };
}

/**
 * The fixed dock (#dock), after <main>: the line for where you are, plus the waitlist (or, launched, Add to Chrome).
 * Hidden while the hero CTA or #foot is on screen (ship critique), shown while its form is open. Over a dark band
 * it flips light (`dk`), and it flips the header too.
 */
export default function Dock({ locale }: { locale: Locale }) {
  const home = localeFromPath(usePathname() ?? "/").rest === "/";
  const { isOpen, joined, open, close, join } = useContext(JoinCtx);
  const [seen, setSeen] = useState({ cta: true, foot: false });
  const [view, setView] = useState<{ msg: Msg; from: number; best: number; dk: boolean; aside: boolean }>({ msg: null, from: 0, best: 0, dk: false, aside: false });
  const ref = useRef<HTMLDivElement>(null);
  const fmt = useMoney();

  useEffect(() => {
    if (!home) return;
    const update = () => {
      const d = ref.current?.getBoundingClientRect();
      const header = document.querySelector("header");
      header?.toggleAttribute("data-dk", darkAt(60));
      // short phones: the pinned lineup's own buttons sit where the dock would, so the dock steps aside
      const room = rect(document.getElementById("room")), bar = rect(document.getElementById("verdict")?.parentElement ?? null);
      const aside = document.documentElement.classList.contains("lp-m") && !!room && !!bar
        && room.top <= 1 && room.bottom >= innerHeight - 1 && bar.bottom > innerHeight - 100;
      const next = { ...read(), dk: !!d && darkAt(d.top + d.height / 2), aside };
      setView((v) => (Object.keys(next) as (keyof typeof next)[]).every((k) => v[k] === next[k]) ? v : next);
    };
    update();
    const watch = (el: Element | null, key: "cta" | "foot") => {
      if (!el || typeof IntersectionObserver !== "function") return undefined;
      const io = new IntersectionObserver((es) => es.forEach((e) => setSeen((v) => ({ ...v, [key]: e.isIntersecting }))));
      io.observe(el);
      return io;
    };
    const ios = [watch(document.querySelector('#num [data-gp-placement="hero"]'), "cta"), watch(document.getElementById("foot"), "foot")];
    ["scroll", "resize", "gp:product"].forEach((e) => addEventListener(e, update, { passive: true }));
    return () => {
      ios.forEach((io) => io?.disconnect());
      ["scroll", "resize", "gp:product"].forEach((e) => removeEventListener(e, update));
      document.querySelector("header")?.removeAttribute("data-dk");
    };
  }, [home]);

  // the form takes focus as it opens
  useEffect(() => {
    if (isOpen) ref.current?.querySelector<HTMLInputElement>('input[type="email"]')?.focus({ preventScroll: true });
  }, [isOpen]);
  useEffect(() => {
    if (joined) document.getElementById("dt")?.focus({ preventScroll: true });
  }, [joined]);

  if (!home) return null;
  const shown = isOpen || (!seen.cta && !seen.foot && !view.aside);
  const less = fmt(view.from - view.best, 2).replace(".00 ", " ");
  const line = joined ? esc(t(locale, K + "done"))
    : view.msg ? esc(t(locale, MSG[view.msg]))
    : html(locale, K + "elsewhere", {}, { price: `<bdi dir="ltr">${esc(formatMoney(view.best))}</bdi>`, less: `<bdi dir="ltr">${esc(less)}</bdi>` }).__html;
  const cls = [s.dock, shown && "in", view.dk && "dk", isOpen && "join", joined && "done"].filter(Boolean).join(" ");
  return (
    <div ref={ref} className={cls} id="dock" onKeyDown={(e) => { if (e.key === "Escape" && isOpen) close(); }}>
      <GMark className={s.eq} state="idle" label="" />
      {!isOpen && <span className={s.t} id="dt" tabIndex={joined ? -1 : undefined} aria-live={joined ? "polite" : undefined} dangerouslySetInnerHTML={{ __html: line }} />}
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
