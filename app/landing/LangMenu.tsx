"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { t, type Locale } from "../../lib/i18n";
import { switchPath } from "../../lib/locale";
import s from "./LangMenu.module.css";

const K = "web.landing.lang.";
const LANGS: Locale[] = ["en", "ar"];
const FOCUS_KEY = "gp-lng-focus";

/**
 * The header's language menu, ported from combo.html: a globe-only button (the accessible name carries the language label) and a
 * listbox anchored to the button's end edge, so it opens inward in both directions. Esc and an outside press
 * close it; picking the other language goes to the same page in it (the hash and query, so ?p=, are kept) (the choice is not stored: the URL is the language). Items carry
 * lang, never dir: the page direction is the document's.
 */
export default function LangMenu({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null), btn = useRef<HTMLButtonElement>(null), list = useRef<HTMLUListElement>(null);
  const items = () => [...(list.current?.querySelectorAll<HTMLElement>("a[lang]") ?? [])];

  const show = (v: boolean) => {
    setOpen(v);
    if (!v) btn.current?.focus();
  };
  // opening lands on the current language
  useEffect(() => {
    if (open) items().find((x) => x.lang === locale)?.focus();
  }, [open, locale]);
  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    addEventListener("pointerdown", away);
    return () => removeEventListener("pointerdown", away);
  }, [open]);

  // ?p= rides along so the product stays. The mock's gp-lang memory is deliberately not ported: the locale is the URL here
  const target = (to: Locale, query: string, hash: string) => {
    const dest = switchPath(pathname, hash, to), at = dest.indexOf("#");
    return at < 0 ? dest + query : dest.slice(0, at) + query + dest.slice(at);
  };
  // the query and hash are client-only: read when the menu opens, so a new-tab click on a link keeps ?p= too
  const [where, setWhere] = useState({ query: "", hash: "" });
  useEffect(() => { if (open) setWhere({ query: location.search, hash: location.hash }); }, [open, pathname]);
  const pick = (to: Locale) => {
    if (to === locale) { show(false); return; }
    setOpen(false);
    try { sessionStorage.setItem(FOCUS_KEY, "1"); } catch { /* no storage: focus is simply not restored */ }
    router.push(target(to, location.search, location.hash));
  };
  // the page behind the menu remounts for the other locale: put focus back on the button so keyboard and screen reader users keep their place
  useEffect(() => {
    try {
      if (sessionStorage.getItem(FOCUS_KEY)) { sessionStorage.removeItem(FOCUS_KEY); btn.current?.focus({ preventScroll: true }); }
    } catch { /* ignore */ }
  }, []);
  // Enter on a link clicks it (pick below); arrows move between the links
  const onList = (e: KeyboardEvent<HTMLUListElement>) => {
    const o = items(), i = o.indexOf(e.target as HTMLElement);
    if (e.key === "Escape") { e.preventDefault(); show(false); }
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); o[(i + (e.key === "ArrowDown" ? 1 : o.length - 1)) % o.length]?.focus(); }
    else if (e.key === "Tab") setOpen(false);
  };

  return (
    <div className={s.lsel} ref={wrap}>
      <button
        ref={btn}
        type="button"
        className="gp-ctl"
        id="lng"
        aria-expanded={open}
        aria-controls="lmenu"
        aria-label={t(locale, K + "label")}
        onClick={() => show(!open)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && open) { e.preventDefault(); show(false); }
          else if (!open && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) { e.preventDefault(); setOpen(true); }
        }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
        </svg>
      </button>
      <ul ref={list} className={s.lmenu} id="lmenu" aria-label={t(locale, K + "label")} hidden={!open} onKeyDown={onList}>
        {LANGS.map((l) => (
          <li key={l}>
            {/* real links (a disclosure, not a listbox): crawlers and no-JS readers find the other language; the click is pick() */}
            <a
              href={target(l, where.query, where.hash)}
              lang={l}
              aria-current={l === locale ? "true" : undefined}
              data-gp-track="locale_switch"
              data-gp-from={locale}
              data-gp-to={l}
              onClick={(e) => {
                // a modified or non-primary click is the browser's (new tab, new window, download)
                if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                pick(l);
              }}
            >
              {t(locale, K + l)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
