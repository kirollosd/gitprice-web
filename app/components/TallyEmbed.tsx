"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { t, type Locale } from "../../lib/i18n";
import styles from "./TallyEmbed.module.css";

const W = "web.component.webWaitlistForm.";
const LOAD_TIMEOUT_MS = 5000;
const DEFAULT_HEIGHT = 160;

type TallyWindow = Window & { Tally?: { loadEmbeds: () => void } };

/**
 * The waitlist form. Tally's embed script is the form itself, so it loads regardless of analytics consent.
 * If the script errors or `Tally` is still undefined after 5 s, a plain link to the hosted form replaces it.
 */
export default function TallyEmbed({
  formId,
  locale,
  height = DEFAULT_HEIGHT,
  label,
}: {
  formId: string;
  locale: Locale;
  height?: number;
  /** Fallback link text; defaults to the waitlist button label. */
  label?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

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
        <div className={styles.frame} style={{ minBlockSize: height }}>
          <iframe
            data-tally-src={`https://tally.so/embed/${id}?transparentBackground=1&hideTitle=1&dynamicHeight=1&lang=${locale}`}
            title={text}
            width="100%"
            height={height}
            loading="lazy"
            className={styles.iframe}
          />
        </div>
      )}
      <Script src="https://tally.so/widgets/embed.js" strategy="lazyOnload" onReady={onReady} onError={() => setFailed(true)} />
    </>
  );
}
