"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { localeFromPath } from "../../lib/locale";

/** The landing's last section is its own footer (Foot), so the layout's WebFooter steps aside there. */
export default function HideOnHome({ children }: { children: ReactNode }) {
  return localeFromPath(usePathname() ?? "/").rest === "/" ? null : <>{children}</>;
}
