import { t, type Locale } from "../../lib/i18n";
import b from "./base.module.css";
import GMark from "./GMark";
import { html } from "./html";
import { Price, priceHtml } from "./Price";
import type { Product } from "./products";
import { StoreText, storeTextHtml } from "./StoreMark";
import s from "./How.module.css";

const K = "web.landing.how.";
/** "≠ different variant": the sign is decoration, the words are the reason. */
const reason = (r: string) => {
  const m = /^(≠\s*)(.*)$/.exec(r);
  return m ? <><span aria-hidden="true">{m[1]}</span>{m[2]}</> : r;
};

/**
 * 2 · how it works: a pinned browser with three swapping steps. First state: step 01 on, slab and browser tilted,
 * badge, note and panel hidden. Task 5 toggles `on` on #steps > div, #badge, #bnote, #panel and fills #prog b.
 */
export default function How({ locale, product: P }: { locale: Locale; product: Product }) {
  const steps = [1, 2, 3] as const;
  return (
    <section className={`${b.sec} ${s.how}`} id="how" data-gp-section="how">
      <div className={b.stage}>
        <h2 className={b.sr}>{t(locale, K + "title")}</h2>
        <div className={s.slab} id="hslab" />
        <div className={s.steps} id="steps">
          {steps.map((n) => (
            <div key={n} className={n === 1 ? "on" : undefined}>
              <span className={`${s.n} ${b.kick}`}>0{n}</span>
              <h3>{t(locale, `${K}step${n}Title`)}</h3>
              <p>{t(locale, `${K}step${n}Body`)}</p>
            </div>
          ))}
        </div>
        <div className={s.prog} id="prog" aria-hidden="true">
          {steps.map((n) => <i key={n}><b /></i>)}
        </div>
        <div className={s.persp}>
          <div className={s.browser} id="hb">
            <div className={s.bar} data-gp="web" data-theme="light"><i /><i /><i /><span className={s.u}>example.store / {P.short}</span></div>
            <div className={s.pdp} data-gp="web" data-theme="light">
              <div className={s.ph} />
              <div>
                <h4>{P.name}</h4>
                <div className={`${s.pr} ${b.mono}`}><Price v={P.from} /></div>
                <div className={s.ln} /><div className={s.ln} style={{ width: "70%" }} /><div className={s.ln} style={{ width: "85%" }} />
              </div>
            </div>
            <div className={s.badge} id="badge">
              <GMark className={s.eq} state="same" settleOnView label="" />
              <span dangerouslySetInnerHTML={html(locale, K + "badgeOn", {}, { price: priceHtml(P.best.price), store: storeTextHtml(locale, P.best.store) })} />
            </div>
            <div className={`${b.kick} ${s.bnote}`} id="bnote">{t(locale, K + "badgeNote")}</div>
            <div className={s.panel} id="panel">
              <small>{t(locale, K + "panelSame")}</small>
              <div className={`${s.r} ${s.w}`}><span><StoreText label={P.best.store} locale={locale} /></span><b><Price v={P.best.price} /></b></div>
              <div className={s.r}><span><StoreText label={P.other.store} locale={locale} /></span><b><Price v={P.other.price} /></b></div>
              <div className={s.r}><span><StoreText label={P.on} locale={locale} /> · {t(locale, K + "youreHere")}</span><b><s><Price v={P.from} /></s></b></div>
              <div className={`${s.r} ${s.lk}`}>
                <span><StoreText label={P.lookalike.label} locale={locale} bdiRest /> <em className={b.chip}>{reason(P.lookalike.reason)}</em></span>
                <b><Price v={P.lookalike.price} /></b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
