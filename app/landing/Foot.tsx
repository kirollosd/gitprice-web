import { t, type Locale } from "../../lib/i18n";
import b from "./base.module.css";
import { html } from "./html";
import { money } from "./Price";
import type { Product } from "./products";
import s from "./Foot.module.css";

const K = "web.landing.foot.";

/**
 * 5 · the price, cropped. Sits above WebFooter, which keeps the copyright and legal row.
 * Static paint shows #word at rest; Task 5 parallaxes it up from 300px and fits long prices to the width.
 */
export default function Foot({ locale, product: P }: { locale: Locale; product: Product }) {
  return (
    <section id="foot" className={s.foot} data-gp-section="foot">
      <div className={s.cta}>
        <div className={b.kick}>{t(locale, K + "eyebrow")}</div>
        <h2 className={b.big} dangerouslySetInnerHTML={html(locale, K + "title")} />
        <div className={s.btns}>
          <button type="button" className={s.p} data-join="" data-gp-track="cta_click" data-gp-cta-id="join" data-gp-placement="bottom">
            {t(locale, K + "join")}
          </button>
          <a className={s.s} href="#how">{t(locale, K + "howItWorks")}</a>
        </div>
      </div>
      <p className={s.meta} dangerouslySetInnerHTML={html(locale, K + "facts")} />
      <div className={`${s.word} ${b.mono}`} id="word" aria-hidden="true" data-keep-ls="">{money(P.best.price)}</div>
    </section>
  );
}
