"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { t, type Locale } from "../../lib/i18n";
import { pathFor } from "../../lib/locale";
import LanguageSwitch from "./LanguageSwitch";
import styles from "./WebMenu.module.css";

const N = "web.component.webNav.";
const TABLET = "(min-width: 768px)";

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
  const pathname = usePathname();
  const keys = useTablet() ? "menuOpen768" : "menuOpen";
  const home = pathFor(locale, "/");

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);
  return (
    <>
      <button
        ref={button}
        type="button"
        className={styles.button}
        aria-expanded={open}
        aria-controls="web-menu"
        aria-label={t(locale, N + (open ? "a11y.label.menuClose" : "a11y.label.menuOpen"))}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.bars} aria-hidden="true" data-open={open} />
      </button>
      {open && (
        <div id="web-menu" className={styles.overlay}>
          <ul className={styles.list} role="list">
            <li><Link href={`${home}#features`} onClick={close}>{t(locale, `${N}${keys}.label.features`)}</Link></li>
            <li><Link href={`${home}#how-it-works`} onClick={close}>{t(locale, `${N}${keys}.label.howItWorks`)}</Link></li>
            <li><Link href={pathFor(locale, "/sellers")} onClick={close}>{t(locale, `${N}${keys}.label.sellers`)}</Link></li>
          </ul>
          <Link href={`${home}#waitlist`} className={styles.cta} onClick={close}>{t(locale, `${N}${keys}.cta.label`)}</Link>
          <LanguageSwitch locale={locale} />
        </div>
      )}
    </>
  );
}
