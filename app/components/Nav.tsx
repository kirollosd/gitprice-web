import Link from "next/link";
import Logo from "./Logo";
import MobileNav from "./MobileNav";
import styles from "./Nav.module.css";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

/**
 * Site-wide navigation bar.
 * Desktop: logo + links inline.
 * Mobile: logo + hamburger (handled by MobileNav Client Component).
 */
export default function Nav() {
  return (
    <header className={styles.header}>
      <nav className={`${styles.nav} container`} aria-label="Main navigation">
        <Logo variant="full" />

        {/* Desktop links */}
        <ul className={styles.links} role="list">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} className={styles.link}>
                {label}
              </Link>
            </li>
          ))}
          <li>
            <a
              href="https://chromewebstore.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.cta}
            >
              Add to Chrome
            </a>
          </li>
        </ul>

        {/* Mobile hamburger — Client Component */}
        <MobileNav links={NAV_LINKS} />
      </nav>
    </header>
  );
}
