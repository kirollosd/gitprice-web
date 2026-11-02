"use client";

import { createClient, type EmailOtpType } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { handoff, takeAuth } from "../../lib/authHandoff";
import { env } from "../../lib/env";
import { t, type Locale } from "../../lib/i18n";
import { pathFor } from "../../lib/locale";
import StatusIcon from "./StatusIcon";
import { useHeadingFocus } from "./useHeadingFocus";
import styles from "./Hosted.module.css";

const K = "web.auth.";
const TYPES = ["signup", "recovery", "email_change"] as const;
type Pending = { tokenHash: string; type: EmailOtpType & (typeof TYPES)[number] };
type Status = "ready" | "busy" | "done" | "failed" | "retry";

/** A thrown network error, no HTTP status, or a 5xx may succeed next time; a 4xx answer (expired, used) never will. */
const isRetryable = (e: { status?: number }) => !e.status || e.status >= 500;

/**
 * Email link landing. Link scanners fetch URLs and run page scripts, so nothing is verified on load: the head script has
 * already removed the token from the address bar, it waits in memory, and only a click spends it.
 */
export default function ConfirmEmail({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("ready");
  const [pending, setPending] = useState<Pending | null>(null);
  const read = useRef(false);
  const view = status === "done" ? "confirmed" : status === "failed" ? "confirm.failed" : "confirm";
  const heading = useHeadingFocus(view);

  useEffect(() => {
    if (read.current) return; // effects run twice in dev; the URL is already clean the second time
    read.current = true;
    const held = takeAuth();
    const q = new URLSearchParams(held ? held.search : window.location.search);
    const tokenHash = q.get("token_hash");
    const type = TYPES.find((x) => x === q.get("type"));
    // Without the head script (dev, blocked) the token is still in the URL: remove it, keeping the router's history.state.
    window.history.replaceState(window.history.state, "", window.location.pathname);
    if (tokenHash && type) setPending({ tokenHash, type });
    else setStatus("failed");
  }, []);

  async function confirm() {
    if (!pending || status === "busy") return;
    setStatus("busy");
    if (pending.type === "recovery") {
      // Verifying here would drop the session; the reset form verifies and sets the password. Hand the token over in memory.
      handoff({ search: `?token_hash=${encodeURIComponent(pending.tokenHash)}&type=recovery`, hash: "", clicked: true });
      router.push(pathFor(locale, "/reset-password"));
      return;
    }
    try {
      const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, { auth: { persistSession: false, detectSessionInUrl: false } });
      const { error } = await supabase.auth.verifyOtp({ token_hash: pending.tokenHash, type: pending.type });
      if (!error) return setStatus("done");
      setStatus(isRetryable(error) ? "retry" : "failed");
    } catch {
      setStatus("retry");
    }
  }

  const showButton = status === "ready" || status === "busy" || status === "retry";
  const body = status === "retry" ? K + "confirm.retry.body" : `${K}${view}.body`;
  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <StatusIcon kind={status === "done" ? "check" : status === "failed" ? "alert" : "lock"} />
        <h1 ref={heading} tabIndex={-1} className={styles.h1}>{t(locale, `${K}${view}.title`)}</h1>
        <p role="status" aria-live="polite" className={styles.muted}>{t(locale, body)}</p>
      </div>
      {showButton && (
        <button type="button" className={styles.button} onClick={confirm} disabled={status === "busy" || !pending}>
          {t(locale, K + (status === "busy" ? "confirm.button.busy" : "confirm.button.label"))}
        </button>
      )}
    </div>
  );
}
