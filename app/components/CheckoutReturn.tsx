"use client";

import { useEffect, useRef, useState } from "react";
import { getReturnStatus } from "../../lib/api";
import type { Locale } from "../../lib/i18n";
import CheckoutCard from "./CheckoutCard";

type View = "waiting" | "timedOut" | "success" | "failed" | "cancelled";

const POLL_MS = 2_000;
const POLL_CAP_MS = 60_000;
const FETCH_TIMEOUT_MS = 5_000;

export default function CheckoutReturn({ locale }: { locale: Locale }) {
  const [view, setView] = useState<View>("waiting");
  // Parsed once and kept in a ref: the URL is stripped, and StrictMode re-runs the effect.
  const input = useRef<{ token: string; cancelled: boolean } | null>(null);

  useEffect(() => {
    if (!input.current) {
      const p = new URLSearchParams(window.location.hash.slice(1));
      input.current = { token: p.get("rt") ?? "", cancelled: p.get("status") === "cancelled" };
      // The return token leaves the address bar and history before any network call.
      window.history.replaceState(null, "", window.location.pathname);
    }
    const { token, cancelled } = input.current;
    if (cancelled) return setView("cancelled");
    if (!token) return setView("timedOut");

    const unmount = new AbortController();
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = Date.now() + POLL_CAP_MS;

    async function poll() {
      const r = await getReturnStatus(token, AbortSignal.any([unmount.signal, AbortSignal.timeout(FETCH_TIMEOUT_MS)]));
      if (stopped) return;
      if (r.ok && r.data.status === "active") return setView("success");
      if (r.ok && r.data.status === "failed") return setView("failed");
      // An unknown or expired token will never resolve; 5xx, network errors and timeouts may, so they keep polling.
      if (!r.ok && r.status === 404) return setView("timedOut");
      if (Date.now() >= deadline) return setView("timedOut");
      timer = setTimeout(poll, POLL_MS);
    }
    void poll();
    return () => {
      stopped = true;
      unmount.abort();
      clearTimeout(timer);
    };
  }, []);

  if (view === "timedOut") return <CheckoutCard locale={locale} k="waiting" />;
  return <CheckoutCard locale={locale} k={view} spinner={view === "waiting"} />;
}
