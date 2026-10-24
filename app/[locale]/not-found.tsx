"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "../../lib/i18n";
import { localeFromPath, pathFor } from "../../lib/locale";
import styles from "./not-found.module.css";

const K = "web.notFound.";

export default function NotFound() {
  const { locale } = localeFromPath(usePathname());
  return (
    <section className={`container ${styles.root}`}>
      <h1 className={styles.title}>{t(locale, K + "title")}</h1>
      <p className={styles.body}>{t(locale, K + "body")}</p>
      <Link href={pathFor(locale, "/")}>{t(locale, K + "back.label")}</Link>
    </section>
  );
}
