import Link from "next/link";
import styles from "./Logo.module.css";

interface LogoProps {
  /** "full" shows icon + wordmark; "icon" shows icon only */
  variant?: "full" | "icon";
  className?: string;
}

/**
 * GitPrice logo — inline SVG so colors adapt cleanly to the dark site theme.
 * The "G" mark uses the brand emerald; the wordmark uses light text.
 */
export default function Logo({ variant = "full", className }: LogoProps) {
  return (
    <Link
      href="/"
      className={`${styles.root} ${className ?? ""}`}
      aria-label="GitPrice home"
    >
      {/* Brand "G" icon mark */}
      <svg
        className={styles.icon}
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="7" fill="#34d399" />
        <text
          x="5.5"
          y="24"
          fontSize="21"
          fontWeight="800"
          fontFamily="Sora, system-ui, sans-serif"
          fill="#0f0f1a"
        >
          G
        </text>
      </svg>

      {variant === "full" && (
        <span className={styles.wordmark}>GitPrice</span>
      )}
    </Link>
  );
}
