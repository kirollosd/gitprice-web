"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isHostedPath, localeFromPath } from "../../lib/locale";

/** Hosted pages (reset password, checkout) show a minimal shell, so site chrome is dropped there. */
export default function HideOnHosted({ children }: { children: ReactNode }) {
  return isHostedPath(localeFromPath(usePathname()).rest) ? null : children;
}
