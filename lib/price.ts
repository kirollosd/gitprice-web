import type { Locale } from "./i18n";

/** priceMinor is in the currency's minor unit: 2 digits for EGP, 0 for JPY, 3 for KWD. */
export function formatPrice(locale: Locale, priceMinor: number, currency: string): string {
  const l = locale === "ar" ? "ar" : "en";
  try {
    const nf = new Intl.NumberFormat(l, { style: "currency", currency });
    return nf.format(priceMinor / 10 ** nf.resolvedOptions().maximumFractionDigits!);
  } catch {
    return `${priceMinor} ${currency}`;
  }
}
