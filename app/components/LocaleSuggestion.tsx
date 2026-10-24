"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { localeFromPath, pathFor } from "../../lib/locale";
import { t } from "../../lib/i18n";

const hasCookie = (name: string, value: string) => document.cookie.split("; ").includes(`${name}=${value}`);

/** Dismissible Arabic switch prompt. Middleware sets gp_suggest=ar; never redirects. */
export default function LocaleSuggestion() {
  const [show, setShow] = useState(false);
  const pathname = usePathname();
  // ponytail: read after mount so static HTML is identical for everyone; cookie is client-only.
  useEffect(() => setShow(hasCookie("gp_suggest", "ar") && !hasCookie("gp_suggest_dismissed", "1")), []);
  if (!show) return null;

  const dismiss = () => {
    document.cookie = "gp_suggest_dismissed=1; path=/; max-age=31536000; samesite=lax";
    setShow(false);
  };
  return (
    <div role="region" aria-label="Language" lang="ar" dir="rtl" style={{ display: "flex", gap: "var(--gp-sp-4)", justifyContent: "center", padding: "var(--gp-sp-2)" }}>
      <Link href={pathFor("ar", localeFromPath(pathname).rest)} hrefLang="ar">العربية</Link>
      <button type="button" onClick={dismiss} aria-label={t("en", "web.component.webCookieNotice.default.button.decline.label")}>×</button>
    </div>
  );
}
