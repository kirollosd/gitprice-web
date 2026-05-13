import Link from "next/link";
import Logo from "./Logo";
import styles from "./Footer.module.css";

const YEAR = new Date().getFullYear();

const LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
] as const;

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.inner} container`}>
        <Logo variant="full" className={styles.logo} />

        <nav aria-label="Footer navigation">
          <ul className={styles.links} role="list">
            {LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className={styles.link}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className={styles.copy}>
          &copy; {YEAR} GitPrice. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
