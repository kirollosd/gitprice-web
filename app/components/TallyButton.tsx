"use client";

import { useEffect } from "react";
import styles from "./TallyButton.module.css";

interface TallyButtonProps {
  formId?: string;
  label?: string;
  className?: string;
}

/**
 * Renders a "Join waitlist" button that opens the Tally form as a popup.
 * Loads the Tally embed script once and invokes the popup on click.
 */
export default function TallyButton({
  formId = "mYLGEG",
  label = "Join the Waitlist",
  className = "",
}: TallyButtonProps) {
  useEffect(() => {
    const SCRIPT_ID = "tally-js";
    if (document.getElementById(SCRIPT_ID)) return;
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://tally.so/widgets/embed.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleClick = () => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tally = (window as any).Tally;
    if (tally) {
      tally.openPopup(formId, { layout: "modal", width: 480 });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${styles.btn} ${className}`}
    >
      {label}
    </button>
  );
}
