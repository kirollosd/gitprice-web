import styles from "./StoreChip.module.css";

interface StoreChipProps {
  name: string;
  /** Short two-letter initials shown as avatar fallback */
  initials: string;
  /** Optional CSS class on the root element */
  className?: string;
}

/**
 * Pill chip displaying a supported store name.
 * Uses a coloured initials badge since store logos aren't available as assets.
 */
export default function StoreChip({ name, initials, className = "" }: StoreChipProps) {
  return (
    <div className={`${styles.chip} ${className}`}>
      <span className={styles.avatar}>{initials}</span>
      <span className={styles.name}>{name}</span>
    </div>
  );
}
