"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./MobileNav.module.css";

interface NavLink {
  readonly href: string;
  readonly label: string;
}

interface MobileNavProps {
  links: readonly NavLink[];
}

/**
 * Mobile navigation drawer — Client Component.
 * Renders only on small screens (hamburger hidden on desktop via CSS).
 */
export default function MobileNav({ links }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  return (
    <>
      {/* Hamburger button — only visible on mobile */}
      <button
        className={styles.hamburger}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={`${styles.bar} ${open ? styles.barTop : ""}`} />
        <span className={`${styles.bar} ${open ? styles.barMid : ""}`} />
        <span className={`${styles.bar} ${open ? styles.barBot : ""}`} />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className={styles.overlay}
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <nav
        id="mobile-menu"
        className={`${styles.drawer} ${open ? styles.drawerOpen : ""}`}
        aria-label="Mobile navigation"
      >
        <ul className={styles.list} role="list">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`${styles.link} ${pathname === href ? styles.linkActive : ""}`}
                onClick={() => setOpen(false)}
              >
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
              onClick={() => setOpen(false)}
            >
              Add to Chrome
            </a>
          </li>
        </ul>
      </nav>
    </>
  );
}
