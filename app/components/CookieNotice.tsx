"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { readConsent, REOPEN_EVENT, setConsent } from "../../lib/consent";
import { t, type Locale } from "../../lib/i18n";
import { pathFor } from "../../lib/locale";
import styles from "./CookieNotice.module.css";

const K = "web.component.webCookieNotice.default.";
const FOOTER_K = "web.component.webFooter.default.label.cookies";

/** Footer control that reopens the notice. */
export function CookieSettingsButton({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <button type="button" data-cookie-settings className={className} onClick={() => window.dispatchEvent(new Event(REOPEN_EVENT))}>
      {t(locale, FOOTER_K)}
    </button>
  );
}

/** Non-modal notice. Hidden on the server; shown after mount when no choice is stored. */
export default function CookieNotice({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const reopened = useRef(false);

  useEffect(() => {
    // ponytail: consent lives in a client-only cookie, so pages stay static and reveal after mount.
    setOpen(readConsent(document.cookie) === null);
    const reopen = () => { reopened.current = true; setOpen(true); };
    window.addEventListener(REOPEN_EVENT, reopen);
    return () => window.removeEventListener(REOPEN_EVENT, reopen);
  }, []);

  useEffect(() => {
    if (open && reopened.current) ref.current?.focus();
  }, [open]);

  if (!open) return null;

  const choose = (value: "allow" | "decline") => {
    setConsent(value);
    setOpen(false);
    // The clicked button unmounts, so focus would drop to body: send it to the footer control or main.
    const target = reopened.current ? "[data-cookie-settings]" : "main";
    reopened.current = false;
    document.querySelector<HTMLElement>(target)?.focus();
  };

  return (
    <section ref={ref} tabIndex={-1} role="region" aria-labelledby="cookie-notice-title" className={styles.notice}>
      <h2 id="cookie-notice-title" className={styles.title}>{t(locale, K + "title")}</h2>
      <p className={styles.body}>{t(locale, K + "body")}</p>
      <Link href={pathFor(locale, "/privacy")} className={styles.link}>{t(locale, K + "label.privacy")}</Link>
      <div className={styles.actions}>
        <button type="button" className={styles.button} onClick={() => choose("decline")}>{t(locale, K + "button.decline.label")}</button>
        <button type="button" className={styles.button} onClick={() => choose("allow")}>{t(locale, K + "button.allow.label")}</button>
      </div>
    </section>
  );
}
