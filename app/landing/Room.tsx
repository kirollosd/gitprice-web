import { t, type Locale } from "../../lib/i18n";
import b from "./base.module.css";
import { html, nb } from "./html";
import { Price } from "./Price";
import type { Product } from "./products";
import { marksHtml, StoreText, storeTextHtml } from "./StoreMark";
import s from "./Room.module.css";

const K = "web.landing.room.";
const LETTERS = "ABCD";

/** Product art is drawn, not photographed: "charger small" → the module's .art.charger.small. */
export function Art({ c }: { c: string }) {
  return <span className={[s.art, ...c.split(" ").map((x) => s[x])].join(" ")} />;
}

/**
 * 2c · spot the same one: four suspects, one is the exact product. First state: the lineup is dealt but hidden
 * (Task 5 adds `in`, then `picked`, `rev`, `out` per card; fills #verdict; swaps #roomh copy; moves `on` along #dots).
 */
export default function Room({ locale, product: P }: { locale: Locale; product: Product }) {
  return (
    <section id="room" className={s.room}>
      <div className={s.top}>
        <h2 id="roomh" dangerouslySetInnerHTML={html(locale, K + "title")} />
        <div className={s.ref}>
          <div className={s.img} id="refimg"><Art c={P.art} /></div>
          <div>
            <small id="refon" dangerouslySetInnerHTML={html(locale, K + "youreOn", {}, { store: storeTextHtml(locale, P.on) })} />
            <div className={s.refname} id="refname">{P.name}</div>
            <div className={`${s.pr} ${b.mono}`} id="refpr"><Price v={P.from} /></div>
          </div>
        </div>
      </div>
      <div className={s.wall}>
        <div className={s.lines} id="lines" aria-hidden="true">
          {[0, 1, 2, 3].map((k) => (
            <div key={k} style={{ top: 110 + k * 110 }}><span>{P.units[3 - k]}</span><span className={s.r}>{P.units[3 - k]}</span></div>
          ))}
        </div>
        <div className={s.sus} id="sus">
          {P.lineup.map(([store, name, price, art, exact, why], k) => (
            <button key={k} type="button" className={s.s} data-k={k}>
              <div className={s.img}><Art c={art} /></div>
              {exact === 1 ? (
                <span className={s.stamp}><span className={s.eq} aria-hidden="true">=</span>{t(locale, K + "stamp")}</span>
              ) : (
                <span className={s.why}><span className={s.eq} aria-hidden="true">≠</span>{why}</span>
              )}
              <div className={s.store}><StoreText label={store} locale={locale} /></div>
              <h3>{nb(name)}</h3>
              <div className={`${s.pr} ${b.mono}`}><Price v={price} /></div>
              <span className={s.plac} aria-hidden="true">{LETTERS[k]}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={s.lbar}>
        <p className={s.verdict} id="verdict" aria-live="polite" />
        <div className={s.ctl}>
          <span className={s.dots} id="dots" aria-hidden="true"><i className="on" /><i /><i /></span>
          <button type="button" className={s.g} id="reveal">{t(locale, K + "show")}</button>
          <button type="button" className={s.p} id="next">{t(locale, K + "next")}</button>
        </div>
      </div>
      <p className={s.hint} dangerouslySetInnerHTML={html(locale, "web.landing.spot.note", {}, { marks: marksHtml(locale) })} />
    </section>
  );
}
