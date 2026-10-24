"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { t, type Locale } from "../../lib/i18n";
import { pathFor } from "../../lib/locale";
import LanguageSwitch from "./LanguageSwitch";
import { ctaFor, sellersLinkFor, useOnSellers } from "./NavLinks";
import styles from "./WebMenu.module.css";

const N = "web.component.webNav.";
const TABLET = "(min-width: 768px)";
const DESKTOP = "(min-width: 1024px)";

function useTablet(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia?.(TABLET);
      mq?.addEventListener("change", cb);
      return () => mq?.removeEventListener("change", cb);
    },
    () => window.matchMedia?.(TABLET).matches ?? false,
    () => false,
  );
}

/** Menu button plus full-screen in-flow overlay (fixed, inset 0) shown below 1024px. */
export default function WebMenu({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const keys = useTablet() ? "menuOpen768" : "menuOpen";
  const home = pathFor(locale, "/");
  const onSellers = useOnSellers();
  const sellers = sellersLinkFor(locale, keys, onSellers);
  const cta = ctaFor(locale, keys, onSellers);

  const close = () => {
    setOpen(false);
    button.current?.focus();
  };

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    overlay.current?.querySelector<HTMLElement>("a")?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia?.(DESKTOP);
    const onDesktop = () => desktop?.matches && setOpen(false);
    desktop?.addEventListener("change", onDesktop);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close();
      if (e.key !== "Tab") return;
      // Keep Tab inside the button + overlay links (smaller than inerting the page behind).
      const items = [button.current!, ...overlay.current!.querySelectorAll<HTMLElement>("a, button")];
      const i = items.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      items[(i + (e.shiftKey ? -1 : 1) + items.length) % items.length].focus();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      desktop?.removeEventListener("change", onDesktop);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={button}
        type="button"
        className={styles.button}
        aria-expanded={open}
        aria-controls={open ? "web-menu" : undefined}
        aria-label={t(locale, N + (open ? "a11y.label.menuClose" : "a11y.label.menuOpen"))}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span className={styles.bars} aria-hidden="true" data-open={open} />
      </button>
      {open && (
        <div id="web-menu" ref={overlay} className={styles.overlay}>
          {/* Unlabelled on purpose: the header nav already owns "Main navigation" at 768-1023. */}
          <nav>
          <ul className={styles.list} role="list">
            <li><Link href={`${home}#features`} onClick={() => setOpen(false)}>{t(locale, `${N}${keys}.label.features`)}</Link></li>
            <li><Link href={`${home}#how-it-works`} onClick={() => setOpen(false)}>{t(locale, `${N}${keys}.label.howItWorks`)}</Link></li>
            <li><Link href={sellers.href} onClick={() => setOpen(false)}>{sellers.label}</Link></li>
            <li><LanguageSwitch locale={locale} icon /></li>
          </ul>
          </nav>
          <Link href={cta.href} className={styles.cta} onClick={() => setOpen(false)}>{cta.label}</Link>
        </div>
      )}
    </>
  );
}
