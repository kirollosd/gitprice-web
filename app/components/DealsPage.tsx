import { env } from "../../lib/env";
import { formatDealTime, formatEGP, type DealInsight, type PublicDeal } from "../../lib/deals";
import { t, type Locale } from "../../lib/i18n";
import legal from "./LegalPage.module.css";
import { ChannelLink } from "./NavLinks";
import styles from "./DealsPage.module.css";

const D = "web.deals.";

function insightText(locale: Locale, x: DealInsight): string | null {
  switch (x.kind) {
    case "low_90d":
      return t(locale, D + "insight.low90");
    case "below_avg30":
      return t(locale, D + "insight.belowAvg", { pct: Math.round(x.diff ?? 0) });
    case "cheaper_than":
      return t(locale, D + "insight.cheaperThan", { diff: formatEGP(x.diff ?? 0), store: x.otherStore ?? "" });
    case "popular":
      return t(locale, D + "insight.popular");
    default:
      return null;
  }
}

/** The deals channel's live posts, as text rows (no product images). The legal page template, like /stores. Copy: web.deals.*. */
export default function DealsPage({ locale, deals }: { locale: Locale; deals: PublicDeal[] }) {
  return (
    <div className={`container ${legal.page}`}>
      <header className={legal.header}>
        <h1 className={legal.title}>{t(locale, D + "title")}</h1>
      </header>
      <p className={legal.intro}>{t(locale, D + "intro")}</p>
      {env.telegramChannelUrl && (
        <p className={`${legal.intro} ${styles.channel}`}>
          {t(locale, "web.channel.body")} <ChannelLink locale={locale} placement="deals" />
        </p>
      )}
      <article className={`${legal.article} ${styles.article}`}>
        {deals.length === 0 ? (
          <p className={legal.body}>{t(locale, D + "empty")}</p>
        ) : (
          <ul className={styles.list}>
            {deals.map((d) => {
              const insights = d.insights.map((x) => insightText(locale, x)).filter((s): s is string => s !== null);
              return (
                <li key={`${d.buyUrl}|${d.observedAt}`} className={styles.row}>
                  <div className={styles.body}>
                    <h2 className={styles.title}>{d.title}</h2>
                    <p className={styles.price}>
                      <bdi dir="ltr">{formatEGP(d.price)} <span className={styles.cur}>{t(locale, D + "currency")}</span></bdi>
                    </p>
                    {insights.length > 0 && (
                      <ul className={styles.insights}>
                        {insights.map((s) => <li key={s}>{s}</li>)}
                      </ul>
                    )}
                    <p className={styles.meta}>{t(locale, D + "timeLine", { time: formatDealTime(d.observedAt) })}</p>
                    {d.status === "updated" && <p className={styles.meta}>{t(locale, D + "changed")}</p>}
                  </div>
                  <a
                    className="gp-btn-2 gp-btn-sm"
                    href={d.buyUrl}
                    target="_blank"
                    rel="sponsored noopener"
                    aria-label={t(locale, D + "buyLabel", { store: d.storeName })}
                    data-gp-track="cta_click"
                    data-gp-cta-id="deal_buy"
                    data-gp-placement="deals"
                  >
                    {t(locale, D + "buy", { store: d.storeName })}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </article>
    </div>
  );
}
