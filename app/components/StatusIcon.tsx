import styles from "./Hosted.module.css";

export type IconKind = "lock" | "check" | "clock" | "alert" | "user";

const PATHS: Record<IconKind, React.ReactNode> = {
  lock: <><rect x="5" y="11" width="14" height="10" rx="3" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  check: <><circle cx="12" cy="12" r="9.5" /><path d="m8 12.5 2.8 2.8L16 9.8" /></>,
  clock: <><circle cx="12" cy="12" r="9.5" /><path d="M12 7v5l3 2" /></>,
  alert: <><circle cx="12" cy="12" r="9.5" /><path d="M12 7.5v5M12 16v.5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21c.6-4 3.6-6 7.5-6s6.9 2 7.5 6" /></>,
};
const TONE: Partial<Record<IconKind, string>> = { check: styles.iconOk, alert: styles.iconBad };

/** Decorative 32px stroke icon. The wrapper is not aria-hidden itself, so spinner selectors only see the spinner. */
export default function StatusIcon({ kind }: { kind: IconKind }) {
  return (
    <div className={`${styles.icon} ${TONE[kind] ?? ""}`}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {PATHS[kind]}
      </svg>
    </div>
  );
}
