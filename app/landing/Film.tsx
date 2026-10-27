import { t, type Locale } from "../../lib/i18n";
import b from "./base.module.css";
import DemoVideo from "./DemoVideo";
import { html } from "./html";
import type { Product } from "./products";
import s from "./Film.module.css";

const K = "web.landing.film.";
/** Chapter start times (s) in the demo film. */
export const CHAPTERS = [["shop", 0], ["match", 3.4], ["compare", 5.8], ["alert", 10]] as const;

/**
 * 2b · the film: a tilted inset card that grows to full-bleed, then plays. First state: the small tilted card,
 * chapters hidden. The poster is a CSS background per theme and canvas, set by DemoVideo (--pl/--pd/--pml/--pmd) once the film nears the viewport so it stays off the first-screen bandwidth; DemoVideo also sets #vid
 * src/poster, plays in view and drives the chapter buttons.
 */
export default function Film({ locale, product: P }: { locale: Locale; product: Product }) {
  return (
    <section className={`${b.sec} ${s.film}`} id="film" data-gp-section="film">
      <div className={b.stage}>
        <h2 className={`${b.big} ${s.h2}`} id="fh" dangerouslySetInnerHTML={html(locale, K + "title")} />
        <p className={s.lede2} id="fl">{t(locale, K + "lede")}</p>
        <div className={s.fframe} id="fframe">
          <video id="vid" muted loop playsInline preload="none" />
        </div>
        <div className={s.chap} id="chap">
          <button type="button" className={s.pp} id="vpp" aria-label={t(locale, K + "pause")}>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path id="vppi" d="M3 2h3v10H3zM8 2h3v10H8z" fill="currentColor" /></svg>
          </button>
          {CHAPTERS.map(([k, at]) => (
            <button key={k} type="button" data-t={at}>{t(locale, K + k)}<i /></button>
          ))}
        </div>
      </div>
      <DemoVideo id={P.id} locale={locale} />
    </section>
  );
}
