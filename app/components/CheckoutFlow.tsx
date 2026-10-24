"use client";

import { useEffect, useRef, useState } from "react";
import { getHandoffSummary, redeemHandoff, type HandoffSummary } from "../../lib/api";
import { t, type Locale } from "../../lib/i18n";
import { formatPrice } from "../../lib/price";
import CheckoutCard from "./CheckoutCard";
import styles from "./Checkout.module.css";

const K = "web.checkout.";
type State =
  | { kind: "loading" }
  | { kind: "signedOut" | "alreadyPro" | "failed" }
  | { kind: "summary"; summary: HandoffSummary }
  | { kind: "redirecting"; redirectUrl: string };

// Only http(s) URLs are followed: the value goes into location and an href.
const isWebUrl = (u: string) => {
  try {
    return /^https?:$/.test(new URL(u).protocol);
  } catch {
    return false;
  }
};

export default function CheckoutFlow({ locale }: { locale: Locale }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [redeeming, setRedeeming] = useState(false);
  const code = useRef("");
  const busy = useRef(false);
  const assigned = useRef(false);
  const started = useRef(false);

  useEffect(() => {
    // Effects run twice in dev; the fragment is gone after the first read, so run only once.
    if (started.current) return;
    started.current = true;
    code.current = new URLSearchParams(window.location.hash.slice(1)).get("code") ?? "";
    // The code leaves the address bar and history before any network call.
    window.history.replaceState(null, "", window.location.pathname);
    if (!code.current) return setState({ kind: "signedOut" });

    void getHandoffSummary(code.current).then((r) => {
      if (r.ok) return setState({ kind: "summary", summary: r.data });
      setState({ kind: failure(r.status, r.code) });
    });
  }, []);

  // Navigate only after the redirecting state has committed, once even under StrictMode.
  useEffect(() => {
    if (state.kind !== "redirecting" || assigned.current) return;
    assigned.current = true;
    window.location.assign(state.redirectUrl);
  }, [state]);

  async function onContinue() {
    if (busy.current) return;
    busy.current = true;
    setRedeeming(true);
    const r = await redeemHandoff(code.current, locale);
    if (!r.ok) {
      busy.current = false;
      setRedeeming(false);
      return setState({ kind: failure(r.status, r.code) });
    }
    if (!isWebUrl(r.data.redirectUrl)) return setState({ kind: "failed" });
    setState({ kind: "redirecting", redirectUrl: r.data.redirectUrl });
  }

  switch (state.kind) {
    case "loading":
      return <CheckoutCard locale={locale} spinner busy />;
    case "summary": {
      const { summary } = state;
      return (
        <CheckoutCard locale={locale} k="summary">
          <dl className={styles.rows}>
            <div className={styles.row}>
              <dt>{t(locale, K + "summary.row.label")}</dt>
              <dd>{t(locale, `${K}summary.plan.${summary.period}`)}</dd>
            </div>
            <div className={styles.row}>
              <dt>{t(locale, K + "summary.row.label2")}</dt>
              <dd>{t(locale, `${K}summary.total.${summary.period}`, { price: formatPrice(locale, summary.priceMinor, summary.currency) })}</dd>
            </div>
          </dl>
          <button type="button" className={styles.button} disabled={redeeming} onClick={onContinue}>
            {t(locale, K + "summary.button.label")}
          </button>
        </CheckoutCard>
      );
    }
    case "redirecting":
      return (
        <CheckoutCard locale={locale} k="redirecting" spinner>
          <p className={styles.muted}>{t(locale, K + "redirecting.fallback")}</p>
          <a className={styles.button} href={state.redirectUrl}>{t(locale, K + "redirecting.button.label")}</a>
        </CheckoutCard>
      );
    default:
      return <CheckoutCard locale={locale} k={state.kind} />;
  }
}

/** Dead or used code, already Pro; anything else (5xx, network, unknown code) is a plain failure. */
function failure(status: number, code: string): "signedOut" | "alreadyPro" | "failed" {
  if (status === 404 || status === 410) return "signedOut";
  if (status === 409 && code === "ALREADY_PRO") return "alreadyPro";
  return "failed";
}
