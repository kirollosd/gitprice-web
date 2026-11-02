"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { takeAuth } from "../../lib/authHandoff";
import { env } from "../../lib/env";
import { t, type Locale } from "../../lib/i18n";
import { parseRecovery, validatePassword, type RecoveryInput } from "../../lib/recovery";
import StatusIcon, { type IconKind } from "./StatusIcon";
import { useHeadingFocus } from "./useHeadingFocus";
import styles from "./ResetPasswordForm.module.css";

const K = "web.resetPassword.";
type Status = "confirm" | "verifying" | "ready" | "weak" | "saving" | "success" | "expired" | "error";
type AuthFailure = { code?: string; status?: number } | null;

const isExpired = (e: NonNullable<AuthFailure>) =>
  e.code === "otp_expired" || e.code === "access_denied" || e.status === 401 || e.status === 403;

export default function ResetPasswordForm({ locale }: { locale: Locale }) {
  const [status, setStatus] = useState<Status>("verifying");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const client = useRef<SupabaseClient | null>(null);
  const started = useRef(false);
  const pending = useRef<RecoveryInput | null>(null);
  const view = status === "confirm" || status === "verifying" || status === "expired" || status === "success" ? status : "form";
  const heading = useHeadingFocus(view);

  // Lazy so nothing is created during prerender.
  const supabase = () =>
    (client.current ??= createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { persistSession: false, detectSessionInUrl: false },
    }));

  async function verify(input: RecoveryInput) {
    // Any failure before a session exists is a dead link: the form could not save without one.
    if (input.kind === "none" || input.kind === "error") return setStatus("expired");
    setStatus("verifying");
    try {
      const auth = supabase().auth;
      const { data, error } =
        input.kind === "implicit"
          ? await auth.setSession({ access_token: input.accessToken, refresh_token: input.refreshToken })
          : await auth.verifyOtp({ type: "recovery", token_hash: input.tokenHash });
      if (error || !data.session) return setStatus("expired");
      setEmail(data.user?.email ?? "");
      setStatus("ready");
    } catch {
      setStatus("expired");
    }
  }

  useEffect(() => {
    // Effects run twice in dev; the URL is stripped after the first parse, so read only once.
    if (started.current) return;
    started.current = true;
    // The head script already moved the tokens out of the URL into memory; without it (dev) they are still in the URL.
    const held = takeAuth();
    const input = held ? parseRecovery(held.search, held.hash) : parseRecovery(window.location.search, window.location.hash);
    // Tokens leave the address bar before any network call, are never kept in state, and history.state stays the router's.
    window.history.replaceState(window.history.state, "", window.location.pathname);
    // A link scanner must not spend the token: verify only after a click (the confirm page already had one).
    if (input.kind === "none" || input.kind === "error" || held?.clicked) return void verify(input);
    pending.current = input;
    setStatus("confirm");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once; verify only touches refs and setters
  }, []);

  function onContinue() {
    const input = pending.current;
    pending.current = null;
    if (input) void verify(input);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "saving") return;
    if (validatePassword(password) === "weak") return setStatus("weak");
    setStatus("saving");
    try {
      // A retry reuses the verified session: the OTP is single-use and is not verified again.
      const { error } = await supabase().auth.updateUser({ password });
      if (error) return setStatus(error.code === "weak_password" ? "weak" : isExpired(error) ? "expired" : "error");
      setPassword("");
      setStatus("success");
      void supabase().auth.signOut({ scope: "local" }).catch(() => {});
    } catch {
      setStatus("error");
    }
  }

  if (status === "confirm") {
    return (
      <div className={styles.card}>
        <div className={styles.head}>
          <StatusIcon kind="lock" />
          <h1 ref={heading} tabIndex={-1} className={styles.h1}>{t(locale, "web.auth.confirm.title")}</h1>
          <p className={styles.muted}>{t(locale, "web.auth.confirm.body")}</p>
        </div>
        <button type="button" className={styles.button} onClick={onContinue}>{t(locale, "web.auth.confirm.button.label")}</button>
      </div>
    );
  }
  if (status === "verifying") return <Message locale={locale} k="verifying" heading={heading} />;
  if (status === "expired") return <Message locale={locale} k="linkExpired" heading={heading} />;
  if (status === "success") return <Message locale={locale} k="success" heading={heading} />;

  const feedback = status === "weak" ? t(locale, K + "weak.message") : status === "error" ? t(locale, K + "error.field.message") : "";
  return (
    <form className={styles.card} onSubmit={onSubmit} noValidate>
      <div className={styles.head}>
        <StatusIcon kind="lock" />
        <h1 className={styles.h1}>{t(locale, K + "title")}</h1>
        {email && <p className={styles.muted}>{t(locale, K + "body", { email })}</p>}
      </div>
      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>{t(locale, K + "field.label")}</label>
        <input
          id="password"
          name="password"
          type="password"
          className={styles.input}
          autoComplete="new-password"
          dir="ltr"
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby="password-feedback"
          aria-invalid={feedback ? true : undefined}
        />
        <p id="password-feedback" className={styles.feedback} role="status" aria-live="polite">{feedback}</p>
      </div>
      <button type="submit" className={styles.button} disabled={status === "saving"}>
        {t(locale, status === "saving" ? K + "saving.button.label" : K + "button.label")}
      </button>
    </form>
  );
}

const ICON: Record<string, IconKind> = { success: "check", linkExpired: "clock" };

/** The status region stays mounted across message views, so a swap (verifying to expired) is announced. */
function Message({ locale, k, heading }: { locale: Locale; k: string; heading: RefObject<HTMLHeadingElement | null> }) {
  return (
    <div className={styles.card}>
      <div role="status" aria-live="polite" className={styles.head}>
        {k === "verifying" ? <div className={styles.spinner} aria-hidden="true" /> : <StatusIcon kind={ICON[k]} />}
        <h1 ref={heading} tabIndex={-1} className={styles.h1}>{t(locale, `${K}${k}.title`)}</h1>
        <p className={styles.muted}>{t(locale, `${K}${k}.body`)}</p>
      </div>
    </div>
  );
}
