import type { CSSProperties } from "react";
import { t, type Locale } from "../../lib/i18n";
import b from "./base.module.css";
import BetaTag from "../components/BetaTag";
import { JoinButton } from "./Dock";
import { html } from "./html";
import { splitMoney, useMoney } from "./money";
import { priceHtml } from "./Price";
import ProductPicker from "./ProductPicker";
import type { Product } from "./products";
import { StoreText } from "./StoreMark";
import s from "./Hero.module.css";

const K = "web.landing.hero.";
const isFixed = (c: string) => c === "." || c === ",";

/**
 * 1 · the number. First paint is the scene's first state: the price you are looking at, whole, on a departures board.
 * ScrollScenes rolls each #digits column (translateY in em) to data-to, draws #strike and lights #tags spans with `on`.
 * The board is in the visitor's currency (useMoney); #digits and #cap are rebuilt per product and currency.
 * #num's data-from / data-best (EGP) feed the dock's "elsewhere" line.
 */
export default function Hero({ locale, product: P }: { locale: Locale; product: Product }) {
  const f = useMoney();
  const [from, code] = splitMoney(f(P.from, 0));
  const [to] = splitMoney(f(P.best.price, 0));
  const less = P.from - P.best.price;
  // the caption once the board has landed; ScrollScenes swaps #cap to it
  const done = html(locale, K + "captionDone", { product: P.short }, { less: priceHtml(less, Number.isInteger(less) ? 0 : 2), from: priceHtml(P.from) }).__html;
  return (
    <section className={`${b.sec} ${s.num}`} id="num" data-gp-section="num" data-from={P.from} data-best={P.best.price}>
      <div className={b.stage} style={{ "--len": from.length } as CSSProperties}>
        <ProductPicker locale={locale} />
        <div className={`${b.kick} ${s.kick}`}>{t(locale, K + "eyebrow")}</div>
        <h1 className={s.h1}>{t(locale, K + "headline")}</h1>
        <p key={`cap:${P.id}`} className={s.cap} id="cap" data-done={done} dangerouslySetInnerHTML={html(locale, K + "captionStart", { product: P.name })} />
        <div key={`digits:${P.id}:${from}:${to}`} className={`${s.digits} ${b.mono}`} id="digits" aria-hidden="true" data-keep-ls="" data-from={from} data-to={to}>
          {[...from].map((c, i) =>
            isFixed(c) ? (
              <span key={i} className={`${s.dg} ${s.dot}`} data-keep-ls="">{c}</span>
            ) : (
              <span key={i} className={s.dg} data-keep-ls="">
                <i style={{ transform: `translateY(-${c}em)` }}>
                  {[..."0123456789", " "].map((d) => <span key={d}>{d}</span>)}
                </i>
              </span>
            ),
          )}
          {/* the code sits on the digits' cap line, just past the last digit; the strike covers the digits only */}
          <span className={s.unit} data-cur="">{code}</span>
        </div>
        <div className={s.strike} id="strike" aria-hidden="true" />
        <p className={b.sr} id="numsr">{t(locale, K + "srPrices", { from: `${from} ${code}`, to: `${to} ${code}` })}</p>
        <div key={`tags:${P.id}`} className={s.tags} id="tags">
          {P.tags.map((x) => <span key={x} className={b.chip}>{x}</span>)}
          <span className={s.w}><StoreText label={P.best.store} locale={locale} /></span>
        </div>
        <div className={s.lede}>
          <p id="lede">{t(locale, K + "lede")}</p>
          <div className={s.hcta}>
            <JoinButton locale={locale} placement="hero" className="gp-btn" />
            <BetaTag locale={locale} />
            <a href="#how">{t(locale, K + "seeHow")}</a>
          </div>
          <small>{t(locale, K + "free")}</small>
        </div>
      </div>
    </section>
  );
}
