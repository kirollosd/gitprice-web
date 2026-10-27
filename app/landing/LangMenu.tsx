"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { t, type Locale } from "../../lib/i18n";
import { switchPath } from "../../lib/locale";
import s from "./LangMenu.module.css";

const K = "web.landing.lang.";
const LANGS: Locale[] = ["en", "ar"];

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

  const pick = (to: Locale) => {
    if (to === locale) { show(false); return; }
    setOpen(false);
    // ?p= rides along so the product stays. The mock's gp-lang memory is deliberately not ported: the locale is the URL here
    const dest = switchPath(pathname, location.hash, to), at = dest.indexOf("#");
    router.push(at < 0 ? dest + location.search : dest.slice(0, at) + location.search + dest.slice(at));
  };
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
        className={s.lng}
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
              href={switchPath(pathname, "", l)}
              lang={l}
              aria-current={l === locale ? "true" : undefined}
              data-gp-track="locale_switch"
              data-gp-from={locale}
              data-gp-to={l}
              onClick={(e) => { e.preventDefault(); pick(l); }}
            >
              {t(locale, K + l)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
