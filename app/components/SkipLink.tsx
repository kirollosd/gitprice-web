import { t, type Locale } from "../../lib/i18n";

/** First tab stop: jumps keyboard users past the nav to <main id="main">. */
export default function SkipLink({ locale }: { locale: Locale }) {
  return <a className="skip-link" href="#main">{t(locale, "web.component.webNav.skipLink.label")}</a>;
}
