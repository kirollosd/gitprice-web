"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { env } from "../../lib/env";
import { t, type Locale } from "../../lib/i18n";
import { parseRecovery, validatePassword } from "../../lib/recovery";
import styles from "./ResetPasswordForm.module.css";

const K = "web.resetPassword.";
type Status = "verifying" | "ready" | "weak" | "saving" | "success" | "expired" | "error";
type AuthFailure = { code?: string; status?: number } | null;

const isExpired = (e: NonNullable<AuthFailure>) =>
  e.code === "otp_expired" || e.code === "access_denied" || e.status === 401 || e.status === 403;

export default function ResetPasswordForm({ locale }: { locale: Locale }) {
  const [status, setStatus] = useState<Status>("verifying");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const client = useRef<SupabaseClient | null>(null);
  const started = useRef(false);

  // Lazy so nothing is created during prerender.
  const supabase = () =>
    (client.current ??= createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { persistSession: false, detectSessionInUrl: false },
    }));

  useEffect(() => {
    // Effects run twice in dev; the URL is stripped after the first parse, so verify only once.
    if (started.current) return;
    started.current = true;
    const input = parseRecovery(window.location.search, window.location.hash);
    // Tokens leave the address bar and history before any network call, and are never kept in state.
    window.history.replaceState(null, "", window.location.pathname);

    async function verify() {
      // Any failure before a session exists is a dead link: the form could not save without one.
      if (input.kind === "none" || input.kind === "error") return setStatus("expired");
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
    void verify();
  }, []);

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

  if (status === "verifying") return <Message locale={locale} k="verifying" live />;
  if (status === "expired") return <Message locale={locale} k="linkExpired" />;
  if (status === "success") return <Message locale={locale} k="success" />;

  const feedback = status === "weak" ? t(locale, K + "weak.message") : status === "error" ? t(locale, K + "error.field.message") : "";
  return (
    <form className={styles.card} onSubmit={onSubmit} noValidate>
      <h1 className={styles.h1}>{t(locale, K + "title")}</h1>
      {email && <p className={styles.muted}>{t(locale, K + "body", { email })}</p>}
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

function Message({ locale, k, live }: { locale: Locale; k: string; live?: boolean }) {
  return (
    <div className={styles.card} role={live ? "status" : undefined}>
      <h1 className={styles.h1}>{t(locale, `${K}${k}.title`)}</h1>
      <p className={styles.muted}>{t(locale, `${K}${k}.body`)}</p>
    </div>
  );
}
