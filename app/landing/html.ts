import { t, type Locale } from "../../lib/i18n";

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s: string | number) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

/**
 * Landing copy that carries its own markup (<b> <em> <s> <br> <bdi>), for dangerouslySetInnerHTML.
 * `vars` are escaped; `trusted` is only for fragments this code builds itself (store marks, prices), never URL or user input.
 */
export function html(
  locale: Locale,
  key: string,
  vars: Record<string, string | number> = {},
  trusted: Record<string, string> = {},
): { __html: string } {
  const safe = Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, esc(v)]));
  return { __html: t(locale, key, { ...safe, ...trusted }) };
}
