import { t, type Locale } from "../../lib/i18n";
import b from "./base.module.css";
import { JoinButton } from "./Dock";
import { html } from "./html";
import { splitMoney, useMoney } from "./money";
import type { Product } from "./products";
import s from "./Foot.module.css";

const K = "web.landing.foot.";

/**
 * 5 · the price, cropped. Sits above WebFooter, which keeps the copyright and legal row.
 * Static paint shows #word at rest; ScrollScenes parallaxes it up from 300px and fits long prices to the width.
 * #word is the other store's price in the visitor's currency, value only (a decorative, aria-hidden crop).
 */
export default function Foot({ locale, product: P }: { locale: Locale; product: Product }) {
  const [word] = splitMoney(useMoney()(P.best.price, 2));
  return (
    <section id="foot" className={s.foot} data-gp-section="foot">
      <div className={s.cta}>
        <div className={b.kick}>{t(locale, K + "eyebrow")}</div>
        <h2 className={b.big} dangerouslySetInnerHTML={html(locale, K + "title")} />
        <div className={s.btns}>
          <JoinButton locale={locale} placement="bottom" className={s.p} />
          <a className={s.s} href="#how">{t(locale, K + "howItWorks")}</a>
        </div>
      </div>
      <p className={s.meta} dangerouslySetInnerHTML={html(locale, K + "facts")} />
      <div className={`${s.word} ${b.mono}`} id="word" aria-hidden="true" data-keep-ls="">{word}</div>
    </section>
  );
}
