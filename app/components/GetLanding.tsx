"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { isPhoneUserAgent } from "../../lib/device";
import { isValidEmail } from "../../lib/email";
import { t, type Locale } from "../../lib/i18n";
import { track } from "../../lib/track";
import type { UtmParams } from "../../lib/utm";
import styles from "./GetLanding.module.css";

const G = "web.get.";
const HONEYPOT = "gp_hp";
const TIMEOUT_MS = 10_000;

type Status = "empty" | "error" | "submitting" | "sent" | "failed";

type Props = {
  locale: Locale;
  /** Server UA guess; refined on the client with coarse pointer + width. */
  phone: boolean;
  chromeHref: string;
  utms: UtmParams;
  /** Cloudflare Turnstile site key; widget omitted when unset. */
  turnstileSiteKey?: string;
};

type TurnstileApi = {
  reset: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** Paid-traffic /get landing: desktop → CWS+UTM; phone → email the link. */
export default function GetLanding({
  locale,
  phone: phoneProp,
  chromeHref,
  utms,
  turnstileSiteKey,
}: Props) {
  const [phone, setPhone] = useState(phoneProp);
  const [showForm, setShowForm] = useState(phoneProp);
  const [status, setStatus] = useState<Status>("empty");
  const [attempt, setAttempt] = useState(0);
  const busy = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    const coarse = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    const refined = isPhoneUserAgent(navigator.userAgent, {
      coarsePointer: !!coarse,
      maxTouchPoints: navigator.maxTouchPoints,
      viewportWidth: window.innerWidth,
    });
    setPhone(refined);
    if (refined) setShowForm(true);
  }, []);

  useEffect(() => {
    if (status === "error") input.current?.focus();
  }, [status, attempt]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy.current) return;
    setAttempt((n) => n + 1);
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "");
    if (!isValidEmail(email)) return setStatus("error");
    const turnstileToken = String(data.get("cf-turnstile-response") ?? "");
    if (turnstileSiteKey && !turnstileToken.trim()) return setStatus("failed");
    busy.current = true;
    setStatus("submitting");
    let ok = false;
    try {
      const res = await fetch("/api/send-to-desktop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Same-origin so gp_consent reaches the server for CAPI gating.
        credentials: "same-origin",
        body: JSON.stringify({
          email: email.trim(),
          website: String(data.get(HONEYPOT) ?? ""),
          locale,
          utms,
          turnstileToken,
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      ok = res.status === 200;
    } catch {
      /* network / timeout: generic failed; never log the email */
    }
    busy.current = false;
    if (ok) {
      track("send_to_desktop", { placement: "get" });
      setStatus("sent");
      return;
    }
    try {
      window.turnstile?.reset();
    } catch {
      /* widget may not be ready */
    }
    setStatus("failed");
  }

  if (status === "sent") {
    return (
      <main className={`container ${styles.root}`}>
        <p className={styles.brand}>GitPrice</p>
        <div className={styles.done}>
          <h1 className={styles.doneTitle}>{t(locale, G + "form.sent.title")}</h1>
          <p className={styles.doneBody}>{t(locale, G + "form.sent.body")}</p>
        </div>
      </main>
    );
  }

  const errorId = `${id}-error`;
  const submitLabel =
    status === "submitting" ? t(locale, G + "form.submitting") : t(locale, G + "form.submit");
  const showEmailForm = phone || showForm;

  return (
    <main className={`container ${styles.root}`}>
      <p className={styles.brand}>GitPrice</p>
      <h1 className={styles.headline}>{t(locale, G + "headline")}</h1>
      <p className={styles.sub}>{t(locale, G + "sub")}</p>

      {!showEmailForm ? (
        <div className={styles.actions}>
          <a
            className={`${styles.chrome} gp-btn`}
            href={chromeHref}
            data-gp-track="store_click"
            data-gp-store="chrome"
            data-gp-placement="get"
          >
            {t(locale, G + "cta.chrome")}
          </a>
          <button type="button" className={styles.secondary} onClick={() => setShowForm(true)}>
            {t(locale, G + "form.emailInstead")}
          </button>
        </div>
      ) : (
        <form className={styles.form} onSubmit={onSubmit} noValidate aria-busy={status === "submitting"}>
          <div className={styles.field}>
            <label htmlFor={`${id}-email`} className={styles.label}>
              {t(locale, G + "form.email.label")}
            </label>
            <input
              ref={input}
              id={`${id}-email`}
              className={styles.input}
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              dir="ltr"
              required
              placeholder={t(locale, G + "form.email.placeholder")}
              onChange={() => status === "error" && setStatus("empty")}
              aria-invalid={status === "error" ? true : undefined}
              aria-describedby={status === "error" ? errorId : undefined}
            />
            {status === "error" && (
              <p id={errorId} className={styles.error}>
                {t(locale, G + "form.email.message")}
              </p>
            )}
          </div>
          <div className={styles.trap} aria-hidden="true">
            <input type="text" name={HONEYPOT} tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>
          {turnstileSiteKey ? (
            <>
              <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
              <div className={styles.turnstile}>
                <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="auto" />
              </div>
            </>
          ) : null}
          <button type="submit" className={`${styles.button} gp-btn`} disabled={status === "submitting"}>
            {submitLabel}
          </button>
          {status === "failed" ? (
            <p role="alert" className={styles.failed}>
              {t(locale, G + "form.failed")}
            </p>
          ) : (
            status !== "error" && <p className={styles.note}>{t(locale, G + "form.note")}</p>
          )}
        </form>
      )}
    </main>
  );
}
