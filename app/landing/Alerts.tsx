import { t, type Locale } from "../../lib/i18n";
import b from "./base.module.css";
import { html } from "./html";
import { CUR, money, priceHtml } from "./Price";
import type { Product } from "./products";
import s from "./Alerts.module.css";

const K = "web.landing.alerts.";
const RULES = [
  ["to", "ruleTo"],
  ["any", "ruleAny"],
  ["rise", "ruleUp"],
] as const;

/**
 * 3b · alerts: drag the line, see when it would have fired. First state: "drops to" on, line at P.alert.
 * Task 5's AlertSlider draws svg#csvg from P.weeks, moves the line, rewrites #tt and flips #rules buttons (`on`, aria-pressed).
 */
export default function Alerts({ locale, product: P }: { locale: Locale; product: Product }) {
  const first = P.weeks.findIndex((v) => v <= P.alert);
  const tt =
    first < 0
      ? html(locale, K + "none")
      : html(locale, K + "wouldDrop", { week: first + 1 }, { price: priceHtml(P.weeks[first]) });
  return (
    <section id="alerts" className={s.alerts} data-gp-section="alerts">
      <div className={`${b.kick} ${s.kick}`}>{t(locale, K + "eyebrow")}</div>
      <h2 className={b.big}>{t(locale, K + "title")}</h2>
      <div className={s.aw}>
        <div className={s.rules} id="rules">
          {RULES.map(([r, k], i) => (
            <button key={r} type="button" data-r={r} className={i === 0 ? "on" : undefined} aria-pressed={i === 0}>
              {t(locale, K + k)}
              <small>{t(locale, K + k + "Hint")}</small>
            </button>
          ))}
        </div>
        <div className={s.chart} id="chart">
          <div className={s.toast} id="toast">
            <span className={s.eq} aria-hidden="true">=</span>
            <div>
              <small>{t(locale, K + "toast")}</small>
              <div id="tt" dangerouslySetInnerHTML={tt} />
            </div>
          </div>
          <svg
            id="csvg"
            className={s.csvg}
            tabIndex={0}
            role="slider"
            aria-label={t(locale, K + "sliderLabel")}
            aria-valuenow={P.alert}
            aria-valuetext={`${money(P.alert)} ${CUR}`}
          />
          <div className={s.hint} id="ahint">
            <span className={s.drag}>{t(locale, K + "hintDrag")}</span>
            <span className={s.tap}>{t(locale, K + "hintTap")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
