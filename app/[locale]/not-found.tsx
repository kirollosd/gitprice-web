"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "../../lib/i18n";
import { localeFromPath, pathFor } from "../../lib/locale";

const K = "web.notFound.";

export default function NotFound() {
  const { locale } = localeFromPath(usePathname());
  return (
    <section className="container" style={{ paddingBlock: "var(--gp-sp-24)", textAlign: "center" }}>
      <h1 style={{ fontSize: "var(--gp-fs-display)", lineHeight: "var(--gp-lh-display)" }}>{t(locale, K + "title")}</h1>
      <p style={{ marginBlock: "var(--gp-sp-4) var(--gp-sp-6)", color: "var(--gp-ink-muted)" }}>{t(locale, K + "body")}</p>
      <Link href={pathFor(locale, "/")}>{t(locale, K + "back.label")}</Link>
    </section>
  );
}
