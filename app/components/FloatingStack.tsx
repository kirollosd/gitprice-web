import styles from "./FloatingStack.module.css";

/** One fixed bottom layer so the locale suggestion and cookie notice stack instead of overlapping. */
export default function FloatingStack({ children }: { children: React.ReactNode }) {
  return <div className={styles.stack}>{children}</div>;
}
