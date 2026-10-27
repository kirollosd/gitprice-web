import { t, type Locale } from "../../lib/i18n";
import AlertSlider from "./AlertSlider";
import b from "./base.module.css";
import type { Product } from "./products";
import s from "./Alerts.module.css";

const K = "web.landing.alerts.";

/** 3b · alerts: drag the line, see when it would have fired. First state: "drops to" on, line at P.alert. */
export default function Alerts({ locale, product: P }: { locale: Locale; product: Product }) {
  return (
    <section id="alerts" className={s.alerts} data-gp-section="alerts">
      <div className={`${b.kick} ${s.kick}`}>{t(locale, K + "eyebrow")}</div>
      <h2 className={b.big}>{t(locale, K + "title")}</h2>
      <AlertSlider locale={locale} product={P} />
    </section>
  );
}
