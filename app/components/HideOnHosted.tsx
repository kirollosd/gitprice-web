"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isHostedPath, localeFromPath } from "../../lib/locale";

/** Hosted pages (reset password, checkout) show a minimal shell: the site chrome is swapped for `fallback`. */
export default function HideOnHosted({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return isHostedPath(localeFromPath(usePathname()).rest) ? fallback : children;
}
