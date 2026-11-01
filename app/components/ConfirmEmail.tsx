"use client";

import { createClient, type EmailOtpType } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { env } from "../../lib/env";
import { t, type Locale } from "../../lib/i18n";
import { pathFor } from "../../lib/locale";
import StatusIcon from "./StatusIcon";
import { useHeadingFocus } from "./useHeadingFocus";
import styles from "./Hosted.module.css";

const K = "web.auth.";
const TYPES = ["signup", "recovery", "email_change"] as const;
type Pending = { tokenHash: string; type: EmailOtpType & (typeof TYPES)[number] };
type Status = "ready" | "busy" | "done" | "failed";

/**
 * Email link landing. Link scanners fetch URLs and run page scripts, so nothing is verified on load: the token is
 * read into memory, removed from the address bar, and only a click spends it.
 */
export default function ConfirmEmail({ locale }: { locale: Locale }) {
  const [status, setStatus] = useState<Status>("ready");
  const pending = useRef<Pending | null>(null);
  const read = useRef(false);
  const [, rerender] = useState(0);
  const view = status === "done" ? "confirmed" : status === "failed" ? "confirm.failed" : "confirm";
  const heading = useHeadingFocus(view);

  useEffect(() => {
    if (read.current) return; // effects run twice in dev; the URL is already clean the second time
    read.current = true;
    const q = new URLSearchParams(window.location.search);
    const tokenHash = q.get("token_hash");
    const type = TYPES.find((x) => x === q.get("type"));
    window.history.replaceState(null, "", window.location.pathname);
    if (tokenHash && type) pending.current = { tokenHash, type };
    else setStatus("failed");
    rerender((n) => n + 1);
  }, []);

  async function confirm() {
    const p = pending.current;
    if (!p || status === "busy") return;
    pending.current = null; // single use
    if (p.type === "recovery") {
      // Verifying here would drop the session; the reset form verifies and then sets the password.
      window.location.assign(`${pathFor(locale, "/reset-password")}?token_hash=${encodeURIComponent(p.tokenHash)}&type=recovery`);
      return;
    }
    setStatus("busy");
    try {
      const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, { auth: { persistSession: false, detectSessionInUrl: false } });
      const { error } = await supabase.auth.verifyOtp({ token_hash: p.tokenHash, type: p.type });
      setStatus(error ? "failed" : "done");
    } catch {
      setStatus("failed");
    }
  }

  const showButton = status === "ready" || status === "busy";
  return (
    <div className={styles.card}>
      <div role="status" aria-live="polite" className={styles.head}>
        <StatusIcon kind={status === "done" ? "check" : status === "failed" ? "alert" : "lock"} />
        <h1 ref={heading} tabIndex={-1} className={styles.h1}>{t(locale, `${K}${view}.title`)}</h1>
        <p className={styles.muted}>{t(locale, `${K}${view}.body`)}</p>
      </div>
      {showButton && (
        <button type="button" className={styles.button} onClick={confirm} disabled={status === "busy" || !pending.current}>
          {t(locale, K + (status === "busy" ? "confirm.button.busy" : "confirm.button.label"))}
        </button>
      )}
    </div>
  );
}
