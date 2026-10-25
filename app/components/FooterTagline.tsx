"use client";

import { t, type Locale } from "../../lib/i18n";
import { useOnSellers } from "./NavLinks";

/** The footer stays in the layout; only this line depends on the page. */
export default function FooterTagline({ locale, className }: { locale: Locale; className?: string }) {
  const key = useOnSellers() ? "web.sellers.footer.tagline" : "web.component.webFooter.default.tagline";
  return <p className={className}>{t(locale, key)}</p>;
}
