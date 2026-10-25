import type { Locale } from "./i18n";

/**
 * priceMinor is in the currency's minor unit: 2 digits for EGP, 0 for JPY, 3 for KWD.
 * Throws on an invalid currency code or amount: a mis-scaled price must never be shown.
 */
export function formatPrice(locale: Locale, priceMinor: number, currency: string): string {
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar" : "en", { style: "currency", currency });
  if (!Number.isFinite(priceMinor)) throw new RangeError("priceMinor must be finite");
  return nf.format(priceMinor / 10 ** nf.resolvedOptions().maximumFractionDigits!);
}
