import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

export type Locale = "en" | "ar";

const messages: Record<Locale, unknown> = { en, ar };

export const dir = (l: Locale) => (l === "ar" ? "rtl" : "ltr");

/** Key is a dotted path such as 'web.home.hero.headline'. Throws on a missing key so gaps fail the build. */
export function t(locale: Locale, key: string, vars: Record<string, string> = {}): string {
  const value = key
    .split(".")
    .reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), messages[locale]);
  if (typeof value !== "string") {
    throw new Error(`Missing i18n key "${key}" for locale "${locale}"`);
  }
  return value.replace(/\{(\w+)\}/g, (m, name: string) => vars[name] ?? m);
}
