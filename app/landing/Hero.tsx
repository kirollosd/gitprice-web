import type { CSSProperties } from "react";
import { t, type Locale } from "../../lib/i18n";
import b from "./base.module.css";
import { html } from "./html";
import { CUR, money } from "./Price";
import { products, type Product } from "./products";
import { StoreText } from "./StoreMark";
import s from "./Hero.module.css";

const K = "web.landing.hero.";
const isFixed = (c: string) => c === "." || c === ",";

/**
 * 1 · the number. First paint is the scene's first state: the price you are looking at, whole, on a departures board.
 * Task 5 rolls each #digits column (translateY in em) to data-to, draws #strike and lights #tags spans with `on`.
 */
export default function Hero({ locale, product: P }: { locale: Locale; product: Product }) {
  const from = money(P.from, 0);
  const to = money(P.best.price, 0);
  return (
    <section className={`${b.sec} ${s.num}`} id="num" data-gp-section="num">
      <div className={b.stage} style={{ "--len": from.length } as CSSProperties}>
        <div className={s.pick} id="pick" role="group" aria-labelledby="pickl">
          <small id="pickl">{t(locale, K + "pick")}</small>
          {products.map((x) => (
            <button key={x.id} type="button" data-id={x.id} aria-pressed={x.id === P.id} className={x.id === P.id ? "on" : undefined}>
              {locale === "ar" ? x.ar.chip : x.chip}
            </button>
          ))}
        </div>
        <div className={`${b.kick} ${s.kick}`}>{t(locale, K + "eyebrow")}</div>
        <h1 className={s.h1}>{t(locale, K + "headline")}</h1>
        <p className={s.cap} id="cap" dangerouslySetInnerHTML={html(locale, K + "captionStart", { product: P.name })} />
        <div className={`${s.digits} ${b.mono}`} id="digits" aria-hidden="true" data-keep-ls="" data-from={from} data-to={to}>
          {[...from].map((c, i) =>
            isFixed(c) ? (
              <span key={i} className={`${s.dg} ${s.dot}`}>{c}</span>
            ) : (
              <span key={i} className={s.dg}>
                <i style={{ transform: `translateY(-${c}em)` }}>
                  {[..."0123456789", " "].map((d) => <span key={d}>{d}</span>)}
                </i>
              </span>
            ),
          )}
        </div>
        <span className={s.unit} data-cur="" aria-hidden="true">{CUR}</span>
        <div className={s.strike} id="strike" aria-hidden="true" />
        <p className={b.sr} id="numsr">{t(locale, K + "srPrices", { from: `${from} ${CUR}`, to: `${to} ${CUR}` })}</p>
        <div className={s.tags} id="tags">
          {P.tags.map((x) => <span key={x}>{x}</span>)}
          <span className={s.w}><StoreText label={P.best.store} locale={locale} /></span>
        </div>
        <div className={s.lede}>
          <p id="lede">{t(locale, K + "lede")}</p>
          <div className={s.hcta}>
            <button type="button" className={s.p} data-join="" data-gp-track="cta_click" data-gp-cta-id="join" data-gp-placement="hero">{t(locale, K + "join")}</button>
            <a href="#how">{t(locale, K + "seeHow")}</a>
          </div>
          <small>{t(locale, K + "free")}</small>
        </div>
      </div>
    </section>
  );
}
