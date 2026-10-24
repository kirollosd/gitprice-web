import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

afterEach(cleanup);

describe("WebFooter tagline", () => {
  const cases: [string, "en" | "ar", string][] = [
    ["/sellers", "en", "Shows which rivals undercut you."],
    ["/sellers/", "en", "Shows which rivals undercut you."],
    ["/ar/sellers", "ar", ""],
    ["/", "en", "Compares prices while you shop."],
    ["/privacy", "en", "Compares prices while you shop."],
    ["/ar", "ar", ""],
  ];
  for (const [path, locale, text] of cases) {
    it(`${locale} ${path}`, async () => {
      pathname = path;
      const { default: WebFooter } = await import("../app/components/WebFooter");
      const { t } = await import("../lib/i18n");
      render(<WebFooter locale={locale} />);
      const key = /\/sellers\/?$/.test(path) ? "web.sellers.footer.tagline" : "web.component.webFooter.default.tagline";
      const expected = text || t(locale, key);
      expect(screen.getByText(expected)).toBeTruthy();
      const other = /\/sellers\/?$/.test(path) ? "web.component.webFooter.default.tagline" : "web.sellers.footer.tagline";
      expect(screen.queryByText(t(locale, other))).toBeNull();
    });
  }
});
