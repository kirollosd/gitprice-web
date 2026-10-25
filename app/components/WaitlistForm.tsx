"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { env } from "../../lib/env";
import { t, type Locale } from "../../lib/i18n";
import { track } from "../../lib/track";
import styles from "./WaitlistForm.module.css";

const W = "web.component.webWaitlistForm.";
// The Sellers boards override the form's note and joined body with seller copy.
const SELLER_NOTE = { hero: "web.sellers.prelaunch.hero.waitlist.note", bottom: "web.sellers.cta.waitlist.note" } as const;
const SELLER_JOINED_BODY = "web.sellers.prelaunchJoined.hero.waitlist.body";
const TIMEOUT_MS = 10_000;
const MAX_EMAIL = 254;

type Status = "empty" | "error" | "submitting" | "joined" | "alreadyJoined" | "failed";

/** The API's rule (POST /api/v1/waitlist): trimmed, at most 254 chars, one @, a local part, and a dotted domain that neither starts nor ends with a dot. */
export function isValidEmail(raw: string): boolean {
  const email = raw.trim();
  if (!email || email.length > MAX_EMAIL) return false;
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  return local.length > 0 && domain.includes(".") && !domain.startsWith(".") && !domain.endsWith(".");
}

/** Maps the API reply to a state: branch on the HTTP status; the error code only tells INVALID_EMAIL apart. */
async function outcome(res: Response): Promise<Status> {
  if (res.status === 201) return "joined";
  if (res.status === 200) return "alreadyJoined";
  if (res.status === 400) {
    const body = (await res.json().catch(() => null)) as { error?: { code?: unknown } } | null;
    if (body?.error?.code === "INVALID_EMAIL") return "error";
  }
  return "failed";
}

/** The prelaunch waitlist form (WebWaitlistForm boards): posts to the GitPrice API, never logs the email. */
export default function WaitlistForm({
  locale,
  audience,
  placement,
  label,
}: {
  locale: Locale;
  audience: "shopper" | "seller";
  /** Where on the page this form sits, for the waitlist_submit event. */
  placement: "hero" | "bottom";
  /** Submit label; defaults to the board's "Join the waitlist". */
  label?: string;
}) {
  const [status, setStatus] = useState<Status>("empty");
  // Bumped on every submit, so a repeated invalid submit refocuses the field after the message renders.
  const [attempt, setAttempt] = useState(0);
  const busy = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const id = useId();

  const done = status === "joined" || status === "alreadyJoined";
  useEffect(() => {
    if (done) title.current?.focus();
    if (status === "error") input.current?.focus();
  }, [status, done, attempt]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy.current) return; // a second click while a request is in flight sends nothing
    setAttempt((n) => n + 1);
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "");
    if (!isValidEmail(email)) return setStatus("error");
    busy.current = true;
    setStatus("submitting");
    let next: Status = "failed";
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/v1/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), audience, locale, website: String(data.get("website") ?? "") }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      next = await outcome(res);
    } catch {
      // Network error or timeout: the failed state, never logged (the request carries the email).
    }
    busy.current = false;
    if (next === "joined" || next === "alreadyJoined") track("waitlist_submit", { audience, placement });
    setStatus(next);
  }

  const seller = audience === "seller";
  if (done) {
    const body = seller && status === "joined" ? SELLER_JOINED_BODY : `${W}${status}.body`;
    const Title = placement === "hero" ? "h2" : "h3";
    return (
      <div className={styles.form} data-waitlist={status}>
        <span className={styles.tile} aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <div className={styles.done}>
          <Title ref={title} tabIndex={-1} className={styles.title}>{t(locale, `${W}${status}.title`)}</Title>
          <p className={styles.body}>{t(locale, body)}</p>
        </div>
      </div>
    );
  }

  const errorId = `${id}-error`;
  const submit = status === "submitting" ? t(locale, W + "submitting.button.submit.label")
    : status === "failed" ? t(locale, W + "failed.button.submit.label")
    : label ?? t(locale, W + "empty.button.submit.label");
  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate aria-busy={status === "submitting"} data-waitlist={status}>
      <div className={styles.field}>
        <label htmlFor={`${id}-email`} className={styles.label}>{t(locale, W + "empty.input.email.label")}</label>
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
          placeholder={t(locale, W + "empty.input.email.placeholder")}
          aria-invalid={status === "error" ? true : undefined}
          aria-describedby={status === "error" ? errorId : undefined}
        />
        {status === "error" && <p id={errorId} className={styles.error}>{t(locale, W + "error.input.email.message")}</p>}
      </div>
      {/* Honeypot: people never see or reach it; a bot that fills it gets a normal-looking join and no row. */}
      <div className={styles.trap} aria-hidden="true">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <button type="submit" className={styles.button} disabled={status === "submitting"}>{submit}</button>
      {status === "failed" ? (
        <p role="alert" className={styles.failed}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          {t(locale, W + "failed.message")}
        </p>
      ) : status !== "error" && <p className={styles.note}>{t(locale, seller ? SELLER_NOTE[placement] : W + "empty.note")}</p>}
    </form>
  );
}
