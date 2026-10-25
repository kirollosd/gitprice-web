"use client";
import { useEffect, useState } from "react";
import styles from "./LegalPage.module.css";

type Item = { id: string; label: string };

/** "On this page": the section nearest the top of the viewport carries aria-current and the board's ink indicator. */
export default function LegalToc({ items, heading }: { items: Item[]; heading: string }) {
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    // A section becomes current once its top crosses the upper third of the viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "0px 0px -66% 0px" },
    );
    for (const { id } of items) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);
  return (
    <nav className={styles.toc} aria-label={heading}>
      <p className={styles.tocHeading} aria-hidden="true">{heading}</p>
      <ol className={styles.tocList}>
        {items.map(({ id, label }) => (
          <li key={id}>
            <a className={styles.tocLink} href={`#${id}`} aria-current={id === active ? "location" : undefined} onClick={() => setActive(id)}>
              {label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
