"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { env } from "../../lib/env";
import { t, type Locale } from "../../lib/i18n";
import { localeFromPath, pathFor } from "../../lib/locale";

const N = "web.component.webNav.";

/** True on /sellers and /ar/sellers: there the seller link points back to shoppers and the CTA stays on the page. */
export function useOnSellers(): boolean {
  const { rest } = localeFromPath(usePathname() ?? "/");
  return rest.replace(/\/$/, "") === "/sellers";
}

/** `keys` is the webNav label set for the current width, e.g. "1440" or "menuOpen". */
export function ctaFor(locale: Locale, keys: string, onSellers: boolean): { href: string; label: string } {
  if (env.launch) {
    return {
      href: env.chromeStoreUrl!,
      label: t(locale, onSellers ? "web.sellers.launch.nav.label" : "web.home.launch.nav.label"),
    };
  }
  return {
    href: onSellers ? "#waitlist" : `${pathFor(locale, "/")}#waitlist`,
    label: t(locale, `${N}${keys}.cta.label`),
  };
}

export function sellersLinkFor(locale: Locale, keys: string, onSellers: boolean): { href: string; label: string } {
  if (!onSellers) return { href: pathFor(locale, "/sellers"), label: t(locale, `${N}${keys}.label.sellers`) };
  // Below 1440 the shorter "For shoppers" label applies.
  const short = keys === "1024" || keys === "768";
  return { href: pathFor(locale, "/"), label: t(locale, short ? "web.sellers.nav.label.sellers2" : "web.sellers.nav.label.sellers") };
}

/** Hidden unless NEXT_PUBLIC_SELLERS_NAV=1 (owner flag). */
export function NavSellers({ locale, keys, className }: { locale: Locale; keys: string; className?: string }) {
  const { href, label } = sellersLinkFor(locale, keys, useOnSellers());
  if (!env.sellersNav) return null;
  return <Link href={href} className={className}>{label}</Link>;
}

export function NavCta({ locale, keys, className, onNavigate }: { locale: Locale; keys: string; className?: string; onNavigate?: () => void }) {
  const { href, label } = ctaFor(locale, keys, useOnSellers());
  return <Link href={href} className={className} onClick={onNavigate}>{label}</Link>;
}
