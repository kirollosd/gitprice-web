"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { t, type Locale } from "../../lib/i18n";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** The theme in effect: an explicit data-theme on <html>, else the OS preference. */
export function effectiveTheme(): "light" | "dark" {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia?.(DARK_QUERY).matches ? "dark" : "light";
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Flips the effective theme and remembers the choice (THEME_BOOT applies it on the next load). */
export default function ThemeToggle({ locale }: { locale: Locale }) {
  // Static HTML assumes light; the real value is read after mount.
  const [theme, setTheme] = useState<"light" | "dark">("light");
  // Switching language remounts <html> without re-running THEME_BOOT, which drops the data-theme set on it: put the remembered choice back before paint.
  useIsoLayoutEffect(() => {
    try {
      const saved = localStorage.getItem("gp-theme");
      if (saved === "light" || saved === "dark") document.documentElement.dataset.theme = saved;
    } catch {
      // Storage blocked: nothing remembered to restore.
    }
  }, []);
  useEffect(() => {
    setTheme(effectiveTheme());
    const mq = window.matchMedia?.(DARK_QUERY);
    const sync = () => setTheme(effectiveTheme());
    mq?.addEventListener("change", sync);
    return () => mq?.removeEventListener("change", sync);
  }, []);

  const dark = theme === "dark";
  const flip = () => {
    const next = effectiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("gp-theme", next);
    } catch {
      // Storage blocked: the choice still applies for this page view.
    }
    setTheme(next);
  };

  return (
    <button type="button" className="gp-ctl" aria-label={t(locale, `web.landing.theme.${dark ? "toLight" : "toDark"}`)} onClick={flip}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" />
      </svg>
    </button>
  );
}
