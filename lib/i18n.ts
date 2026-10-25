import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

export type Locale = "en" | "ar";

const messages: Record<Locale, unknown> = { en, ar };

export const dir = (l: Locale) => (l === "ar" ? "rtl" : "ltr");

/**
 * Key is a dotted path such as 'web.home.hero.headline'.
 * A missing key throws in dev/test so gaps surface early; in production it warns and returns the key.
 */
export function t(locale: Locale, key: string, vars: Record<string, string> = {}): string {
  const value = key
    .split(".")
    .reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), messages[locale]);
  if (typeof value !== "string") {
    const msg = `Missing i18n key "${key}" for locale "${locale}"`;
    if (process.env.NODE_ENV === "production") {
      console.warn(msg);
      return key;
    }
    throw new Error(msg);
  }
  return value.replace(/\{(\w+)\}/g, (m, name: string) => vars[name] ?? m);
}
