"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { t, type Locale } from "../../lib/i18n";
import { switchPath } from "../../lib/locale";
import styles from "./LanguageSwitch.module.css";

/** Shows the other locale's endonym and links to the same page in it. `icon` prefixes a globe. */
export default function LanguageSwitch({ locale, className, icon }: { locale: Locale; className?: string; icon?: boolean }) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  // Hash is client-only; read after mount so static HTML stays identical.
  useEffect(() => {
    const read = () => setHash(window.location.hash);
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [pathname]);

  const to: Locale = locale === "en" ? "ar" : "en";
  return (
    <Link href={switchPath(pathname, hash, to)} lang={to} hrefLang={to} className={`${styles.link} hit-target ${className ?? ""}`}>
      {icon && (
        <svg className={styles.globe} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" /><path d="M2.5 12h19M12 2.5c2.6 2.6 4 5.8 4 9.5s-1.4 6.9-4 9.5c-2.6-2.6-4-5.8-4-9.5s1.4-6.9 4-9.5Z" />
        </svg>
      )}
      {t(locale, `web.component.languageSwitch.default.label.${to}`)}
    </Link>
  );
}
