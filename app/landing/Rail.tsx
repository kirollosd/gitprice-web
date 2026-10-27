import { t, type Locale } from "../../lib/i18n";
import b from "./base.module.css";
import { html } from "./html";
import { priceHtml } from "./Price";
import type { Product } from "./products";
import { marksHtml, StoreText, storeTextHtml } from "./StoreMark";
import s from "./Rail.module.css";

const K = "web.landing.rail.";
const STORES = ["● Store", "▲ Store", "■ Store"];

/**
 * 4 · drag rail: one card per made-up store plus an alert card. Static first paint is a native
 * scroll-snap row; Task 5 adds pointer drag on #track (class `drag`) and the "Drag" cursor.
 */
export default function Rail({ locale, product: P }: { locale: Locale; product: Product }) {
  const mono = (v: number) => `<b class="${b.mono}">${priceHtml(v)}</b>`;
  return (
    <section id="rail" className={s.rail} data-gp-section="rail">
      <div className={s.hd}>
        <h2 className={b.big}>{t(locale, K + "title")}</h2>
        <span className={s.hint} dangerouslySetInnerHTML={html(locale, K + "note", {}, { marks: marksHtml(locale) })} />
      </div>
      <div className={s.track} id="track">
        {STORES.map((st) => (
          <div key={st} className={s.st}>
            <span className={s.tag}><StoreText label={st} locale={locale} /></span>
            <h3>{t(locale, K + "youreOn")}<br /><StoreText label={st} locale={locale} /></h3>
            <div className={s.pill}>
              <span className={s.eq} aria-hidden="true">=</span>
              {st === P.best.store ? (
                t(locale, K + "cheapestHere")
              ) : (
                <span dangerouslySetInnerHTML={html(locale, K + "hasIt", {}, { store: storeTextHtml(locale, P.best.store), price: mono(P.best.price) })} />
              )}
            </div>
          </div>
        ))}
        <div className={s.st}>
          <span className={s.tag}><i aria-hidden="true" />{t(locale, K + "anyPage")}</span>
          <h3 dangerouslySetInnerHTML={html(locale, K + "notToday")} />
          <div className={s.pill}>
            <span className={s.eq} aria-hidden="true">=</span>
            <span dangerouslySetInnerHTML={html(locale, K + "alertSet", {}, { price: mono(P.alert) })} />
          </div>
        </div>
      </div>
    </section>
  );
}
