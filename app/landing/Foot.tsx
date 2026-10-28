import Link from "next/link";
import { t, type Locale } from "../../lib/i18n";
import { pathFor } from "../../lib/locale";
import BetaTag from "../components/BetaTag";
import { CookieSettingsButton } from "../components/CookieNotice";
import b from "./base.module.css";
import { JoinButton } from "./Dock";
import { html } from "./html";
import { splitMoney, useMoney } from "./money";
import type { Product } from "./products";
import s from "./Foot.module.css";

const K = "web.landing.foot.";
const W = "web.component.webFooter.default.";

/**
 * 5 · the price, cropped, and the page's footer (the layout's WebFooter steps aside on the landing): the legal row sits
 * under the facts like the mock's © line, and the word bleeds off the bottom.
 * Static paint shows #word at rest; ScrollScenes parallaxes it up from 300px and fits long prices to the width.
 * #word is the other store's price in the visitor's currency, value only (a decorative, aria-hidden crop).
 */
export default function Foot({ locale, product: P }: { locale: Locale; product: Product }) {
  const [word] = splitMoney(useMoney()(P.best.price, 2));
  return (
    <footer id="foot" role="contentinfo" className={s.foot} data-gp-section="foot">
      <div className={s.cta}>
        <div className={b.kick}>{t(locale, K + "eyebrow")}</div>
        <h2 className={b.big} dangerouslySetInnerHTML={html(locale, K + "title")} />
        <div className={s.btns}>
          <JoinButton locale={locale} placement="bottom" className={s.p} />
          <a className={s.s} href="#how">{t(locale, K + "howItWorks")}</a>
        </div>
      </div>
      {/* facts and the legal row share one column, so the legal row follows the facts however long they run */}
      <div className={s.aside}>
      <p className={s.meta} dangerouslySetInnerHTML={html(locale, K + "facts")} />
      <div className={s.legal}>
        <p>{t(locale, K + "copyright", { year: 2026 })}</p>
        <nav aria-label={t(locale, W + "label.nav")}>
          <Link href={pathFor(locale, "/faq")} data-gp-track="cta_click" data-gp-cta-id="faq" data-gp-placement="footer">{t(locale, W + "label.faq")}</Link>
          <Link href={pathFor(locale, "/privacy")} data-gp-track="cta_click" data-gp-cta-id="privacy_policy" data-gp-placement="footer">{t(locale, W + "label.privacy")}</Link>
          <Link href={pathFor(locale, "/terms")} data-gp-track="cta_click" data-gp-cta-id="terms" data-gp-placement="footer">{t(locale, W + "label.terms")}</Link>
          <CookieSettingsButton locale={locale} />
          <BetaTag locale={locale} />
        </nav>
      </div>
      </div>
      <div className={`${s.word} ${b.mono}`} id="word" aria-hidden="true" data-keep-ls="">{word}</div>
    </footer>
  );
}
