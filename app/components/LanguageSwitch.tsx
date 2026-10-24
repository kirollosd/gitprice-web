"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { t, type Locale } from "../../lib/i18n";
import { switchPath } from "../../lib/locale";
import styles from "./LanguageSwitch.module.css";

/** Shows the other locale's endonym and links to the same page in it. */
export default function LanguageSwitch({ locale }: { locale: Locale }) {
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
    <Link href={switchPath(pathname, hash, to)} lang={to} hrefLang={to} className={styles.link}>
      {t(locale, `web.component.languageSwitch.default.label.${to}`)}
    </Link>
  );
}
