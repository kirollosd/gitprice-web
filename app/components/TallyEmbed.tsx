"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { t, type Locale } from "../../lib/i18n";
import { track } from "../../lib/track";
import styles from "./TallyEmbed.module.css";

const W = "web.component.webWaitlistForm.";
const LOAD_TIMEOUT_MS = 5000;
// Initial frame height before Tally's dynamicHeight takes over: the one-field form's own height, so nothing below jumps.
const DEFAULT_HEIGHT = 120;

type TallyWindow = Window & { Tally?: { loadEmbeds: () => void } };

/**
 * The waitlist form. Tally's embed script is the form itself, so it loads regardless of analytics consent.
 * If the script errors or `Tally` is still undefined after 5 s, a plain link to the hosted form replaces it.
 */
export default function TallyEmbed({
  formId,
  locale,
  audience,
  placement,
  height = DEFAULT_HEIGHT,
  label,
}: {
  formId: string;
  locale: Locale;
  /** Tally hidden field `audience`: tells shopper and seller sign-ups apart in the one form. */
  audience: "shopper" | "seller";
  /** Where on the page this embed sits, for the waitlist_submit event. */
  placement: "hero" | "bottom";
  height?: number;
  /** Fallback link text; defaults to the waitlist button label. */
  label?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [filled, setFilled] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Tally posts "Tally.FormSubmitted" to the parent. Only this embed's own frame counts, so two embeds never double-fire.
  // The payload (form answers) is deliberately never read.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== "https://tally.so" || e.source !== iframeRef.current?.contentWindow) return;
      let data: unknown = e.data;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch { return; }
      }
      if ((data as { event?: unknown } | null)?.event === "Tally.FormSubmitted") track("waitlist_submit", { audience, placement });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [audience, placement]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!(window as TallyWindow).Tally) setFailed(true);
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  const text = label ?? t(locale, W + "empty.button.submit.label");

  // Tally scans the DOM for the iframe, so scan only once it is mounted (not inside the script callback).
  useEffect(() => {
    if (ready && !failed) (window as TallyWindow).Tally?.loadEmbeds();
  }, [ready, failed]);

  const id = encodeURIComponent(formId);
  // Script stays mounted when the fallback shows, so a late load can bring the form back.
  const onReady = () => {
    setReady(true);
    setFailed(false);
  };

  return (
    <>
      {failed ? (
        <a className={styles.fallback} href={`https://tally.so/r/${id}`} target="_blank" rel="noopener">
          {text}
        </a>
      ) : (
        // Light tokens and color-scheme inside the frame: the Tally page is light, so a dark iframe scheme would paint
        // an opaque white canvas behind it. In dark theme the frame is a deliberate light panel instead (CSS).
        <div className={styles.frame} data-gp="app" data-theme="light">
          {/* Skeleton until Tally has loaded the form into the (lazy) frame. */}
          {!filled && (
            <div className={styles.skeleton} aria-hidden="true" data-tally-skeleton>
              <span className={styles.skField} />
              <span className={styles.skButton} />
            </div>
          )}
          <iframe
            ref={iframeRef}
            data-tally-src={`https://tally.so/embed/${id}?transparentBackground=1&hideTitle=1&dynamicHeight=1&lang=${locale}&audience=${audience}`}
            title={text}
            width="100%"
            height={height}
            loading="lazy"
            className={styles.iframe}
            // The frame starts without a src (about:blank); only a load of Tally's page means the form is there.
            onLoad={(e) => e.currentTarget.src.startsWith("https://tally.so/") && setFilled(true)}
          />
        </div>
      )}
      <Script src="https://tally.so/widgets/embed.js" strategy="lazyOnload" onReady={onReady} onError={() => setFailed(true)} />
    </>
  );
}
