import { t, type Locale } from "../../lib/i18n";
import b from "./base.module.css";
import { html } from "./html";
import { Price } from "./Price";
import { products, type Product, type StoreLabel } from "./products";
import { marksHtml, StoreText, storeTextHtml } from "./StoreMark";
import s from "./Print.module.css";

const K = "web.landing.print.";

/** [product id, name, paid, best exact price elsewhere (null: no exact match), best store, store it was bought on] */
type Line = [string, string, number, number | null, StoreLabel | "", StoreLabel];
const line = (x: Product): Line => [x.id, x.name, x.from, x.best.price, x.best.store, x.on];
const byId = (id: string) => products.find((x) => x.id === id)!;
// A fixed everyday cart across the three stores; the hero product is always the first line.
const BASE: Line[] = [
  line(byId("charger")),
  line(byId("cerave")),
  ["", "Logitech M185 · Grey", 499, 435, "● Store", "■ Store"],
  ["", "Garnier Micellar Water · 100ml", 145, 119, "■ Store", "▲ Store"],
  ["", "L'Avvento BG796 backpack · Black", 899, null, "", "● Store"],
  ["", "NIVEA MEN Black & White · spray 150ml", 165, 139, "▲ Store", "■ Store"],
];
export const receiptLines = (P: Product) => [line(P), ...BASE.filter((x) => x[0] !== P.id)].slice(0, 6);

/**
 * 3 · the receipt: one long pinned scene; the copy stacks on the left, a receipt prints out of a slot on the right.
 * First state: point one lit, nothing fed (--fed: 0px on #paper). Task 5 feeds #paper, lights .copy > div with `on`
 * (and --f for its bar), counts #tallyN, and flips #tWith / #tWithout (`raw` on #paper and #tally).
 */
export default function Print({ locale, product: P }: { locale: Locale; product: Product }) {
  const items = receiptLines(P);
  const paid = items.reduce((n, x) => n + x[2], 0);
  const alt = items.reduce((n, x) => n + (x[3] ?? x[2]), 0);
  const month = new Date().toLocaleDateString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US", { month: "long", year: "numeric" });
  const copy = [
    ["title", "lede"],
    ["sameTitle", "sameBody"],
    ["noMatchTitle", "noMatchBody"],
    ["endingsTitle", "endingsBody"],
  ] as const;
  return (
    <div id="rcpt" className={s.rcpt} data-gp-section="rcpt">
      <section id="print" className={s.print}>
        <div className={s.stage}>
          <div className={s.copy}>
            {copy.map(([h, p], i) => (
              <div key={h} className={`${s.c} ${i === 0 ? "on" : ""}`}>
                <h2>{t(locale, K + h)}</h2>
                <p dangerouslySetInnerHTML={html(locale, K + p)} />
                {i === 3 && (
                  <div className={s.tog} role="group" aria-label={t(locale, K + "viewLabel")}>
                    <button type="button" id="tWith" className="on" aria-pressed="true">{t(locale, K + "with")}</button>
                    <button type="button" id="tWithout" aria-pressed="false">{t(locale, K + "without")}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className={s.slotwrap}>
            <div className={s.slot} />
            <div className={s.paper} id="paper">
              <div className={s.hd}>
                <span className={s.logo} role="img" aria-label="GitPrice" />
                <span dangerouslySetInnerHTML={html(locale, K + "header", { month })} />
              </div>
              <div id="items">
                {items.map(([id, name, p, a, best, on]) => (
                  <div key={id || name} className={s.it}>
                    <div className={s.n}>{name}</div>
                    <div className={s.ln}><span><StoreText label={on} locale={locale} /></span>{a ? <s><Price v={p} /></s> : <b><Price v={p} /></b>}</div>
                    {a ? (
                      <>
                        <div className={`${s.ln} ${s.alt}`}>
                          <span className={s.ok}><span className={s.eq} aria-hidden="true">=</span><span dangerouslySetInnerHTML={html(locale, K + "lineSame", {}, { store: storeTextHtml(locale, best) })} /></span>
                          <b><Price v={a} /></b>
                        </div>
                        <div className={`${s.ln} ${s.sv} ${s.alt}`}><span>{t(locale, K + "lineSaved")}</span><span><Price v={p - a} /></span></div>
                      </>
                    ) : (
                      <div className={`${s.ln} ${s.alt}`}>
                        <span className={s.no}><span className={s.eq} aria-hidden="true">?</span>{t(locale, K + "lineNoMatch")}</span>
                        <span><Price v={0} /></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className={s.tot}>
                <div className={s.ln}><span>{t(locale, K + "paid")}</span><span id="tPaid"><Price v={paid} /></span></div>
                <div className={`${s.ln} ${s.alt}`}><span>{t(locale, K + "elsewhere")}</span><span id="tAlt"><Price v={alt} /></span></div>
                <div className={`${s.ln} ${s.big}`}><span>{t(locale, K + "youSaved")}</span><span id="tSave"><Price v={paid - alt} /></span></div>
                <small dangerouslySetInnerHTML={html(locale, K + "footnote", {}, { marks: marksHtml(locale) })} />
              </div>
            </div>
          </div>
          <div className={s.tally} id="tally">
            <small>{t(locale, K + "tally")}</small>
            <b id="tallyN" className={b.mono}><Price v={0} /></b>
          </div>
        </div>
      </section>
    </div>
  );
}
