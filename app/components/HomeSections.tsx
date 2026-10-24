import Link from "next/link";
import type { ReactNode } from "react";
import { env } from "../../lib/env";
import { t, type Locale } from "../../lib/i18n";
import { pathFor } from "../../lib/locale";
import { AlertsArt, HeroArt, HistoryArt, RowsArt } from "./BoardArt";
import StoreBadges from "./StoreBadges";
import TallyEmbed from "./TallyEmbed";
import styles from "./HomeSections.module.css";

const H = "web.home.";

/** Prelaunch: the Tally waitlist form. */
export function Waitlist({ locale, label }: { locale: Locale; label?: string }) {
  return <TallyEmbed formId={env.tallyFormId} locale={locale} label={label} />;
}

/** The numbered steps shared by Home and Sellers. */
export function Steps({ locale, id, prefix }: { locale: Locale; id?: string; prefix: "web.home.how." | "web.sellers.how." }) {
  return (
    <section id={id} className={styles.stepsBand} aria-labelledby={`${prefix}h`}>
      <div className="container">
        <h2 id={`${prefix}h`} className={styles.h2}>{t(locale, prefix + "heading")}</h2>
        <ol className={styles.steps}>
          {[1, 2, 3].map((n) => (
            <li key={n} className={styles.step}>
              <span className={styles.num} aria-hidden="true">{n}</span>
              <h3 className={styles.stepTitle}>{t(locale, `${prefix}${n}.title`)}</h3>
              <p className={styles.muted}>{t(locale, `${prefix}${n}.body`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Closing band on the ink ground; the form or button sits on a surface card. */
export function CtaBand({ title, line, children }: { title: string; line?: string; children: ReactNode }) {
  return (
    <section className={styles.band}>
      <div className={`container ${styles.bandInner}`}>
        <div>
          <h2 className={styles.bandTitle}>{title}</h2>
          {line && <p className={styles.bandLine}>{line}</p>}
        </div>
        <div className={styles.bandCard}>{children}</div>
      </div>
    </section>
  );
}

function Hero({ locale }: { locale: Locale }) {
  return (
    <section className={styles.hero}>
      <div className={`container ${styles.heroGrid}`}>
        <div className={styles.heroText}>
          <p className={styles.chip}>{t(locale, H + "free.label")}</p>
          <h1 className={styles.h1}>{t(locale, H + "hero.headline")}</h1>
          <p className={styles.sub}>{t(locale, H + "hero.sub")}</p>
          <div id="waitlist" className={styles.action}>
            {env.launch ? <StoreBadges locale={locale} /> : <Waitlist locale={locale} />}
          </div>
        </div>
        <HeroArt locale={locale} />
      </div>
    </section>
  );
}

/** The basics a first-time visitor checks for, in a raised band under the hero. */
function Baseline({ locale }: { locale: Locale }) {
  return (
    <section className={styles.baseline}>
      <ul className={`container ${styles.baselineList}`} role="list">
        {(["free", "pageOnly", "languages", "onPage", "stores"] as const).map((k) => (
          <li key={k}>
            <p className={styles.baselineTitle}>{t(locale, `${H}baseline.${k}.title`)}</p>
            <p className={styles.muted}>{t(locale, `${H}baseline.${k}.body`)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

const ART = { rows: RowsArt, alerts: AlertsArt, history: HistoryArt } as const;

type Item = { key: string; tag?: "soon" | "pro"; note?: boolean };
/** GP-372 feature list: two columns from 1024 (Compare + Know when to buy | See it add up + Your way). */
export const GROUPS: { key: string; items: Item[] }[][] = [
  [
    { key: "compare", items: [{ key: "match" }, { key: "variant" }, { key: "soldOut" }] },
    {
      key: "when",
      items: [
        { key: "emailAlerts", tag: "soon" },
        { key: "phoneAlerts", tag: "soon" },
        { key: "priceHistory", note: true },
        { key: "proLimits", tag: "pro" },
      ],
    },
  ],
  [
    { key: "addUp", items: [{ key: "orders" }, { key: "milestones" }] },
    { key: "yourWay", items: [{ key: "pace" }, { key: "theme" }, { key: "sync", tag: "soon" }, { key: "suggestStore", tag: "soon" }] },
  ],
];

function Features({ locale }: { locale: Locale }) {
  const F = H + "features.";
  return (
    <section id="features" className={styles.section} aria-labelledby="features-h">
      <div className="container">
        <h2 id="features-h" className={styles.h2}>{t(locale, F + "heading")}</h2>
        <ul className={styles.bigRows} role="list">
          {(["rows", "alerts", "history"] as const).map((k) => {
            const Art = ART[k];
            return (
              <li key={k} className={styles.bigRow}>
                <div className={styles.bigText}>
                  <h3 className={styles.bigTitle}>{t(locale, `${F}${k}.title`)}</h3>
                  <p className={styles.muted}>{t(locale, `${F}${k}.body`)}</p>
                </div>
                <Art locale={locale} />
              </li>
            );
          })}
        </ul>
        <div className={styles.more}>
          {GROUPS.map((column, i) => (
            <div key={i} className={styles.moreColumn}>
              {column.map((g) => (
                <div key={g.key}>
                  <h3 className={styles.groupTitle}>{t(locale, `${F}groups.${g.key}`)}</h3>
                  <ul className={styles.items} role="list">
                    {g.items.map((it) => (
                      <li key={it.key} className={styles.item} data-feature={it.key}>
                        <div className={styles.itemHead}>
                          <h4 className={styles.itemTitle}>{t(locale, `${F}${it.key}.title`)}</h4>
                          {it.tag && <span className={styles.tag}>{t(locale, `${F}tag.${it.tag}`)}</span>}
                        </div>
                        <p className={styles.itemBody}>{t(locale, `${F}${it.key}.body`)}</p>
                        {it.note && <p className={styles.note}>{t(locale, `${F}${it.key}.pro`)}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Privacy({ locale }: { locale: Locale }) {
  return (
    <section className={styles.section} aria-labelledby="privacy-h">
      <div className={`container ${styles.privacy}`}>
        <div className={styles.privacyHead}>
          <h2 id="privacy-h" className={styles.h2}>{t(locale, H + "privacy.heading")}</h2>
          <Link href={pathFor(locale, "/privacy")} className={styles.textLink}>{t(locale, H + "privacy.link")}</Link>
        </div>
        <ul className={styles.points} role="list">
          {[1, 2, 3].map((n) => (
            <li key={n}>{t(locale, `${H}privacy.point${n}`)}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Faq({ locale }: { locale: Locale }) {
  return (
    <section className={styles.section} aria-labelledby="faq-h">
      <div className="container">
        <h2 id="faq-h" className={styles.h2}>{t(locale, H + "faq.heading")}</h2>
        <ul className={styles.faq} role="list">
          {[1, 2, 3, 4, 5].map((n) => (
            <li key={n}>
              <h3 className={styles.q}>{t(locale, `${H}faq.${n}.q`)}</h3>
              <p className={styles.muted}>{t(locale, `${H}faq.${n}.a`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Home body. `env.launch` picks the Home/launch or Home/prelaunch board. */
export default function HomeContent({ locale }: { locale: Locale }) {
  return (
    <>
      <Hero locale={locale} />
      <Baseline locale={locale} />
      <Features locale={locale} />
      <Steps locale={locale} id="how-it-works" prefix="web.home.how." />
      <Privacy locale={locale} />
      <Faq locale={locale} />
      {env.launch ? (
        <CtaBand title={t(locale, H + "launch.cta.title")} line={t(locale, H + "launch.cta.line")}>
          <StoreBadges locale={locale} />
        </CtaBand>
      ) : (
        <CtaBand title={t(locale, H + "cta.title")} line={t(locale, H + "cta.line")}>
          <Waitlist locale={locale} />
        </CtaBand>
      )}
    </>
  );
}
