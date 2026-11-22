import { env } from "../../lib/env";
import { cairoDay, formatDealTime, formatEGP, type DealInsight, type PublicDeal } from "../../lib/deals";
import { t, type Locale } from "../../lib/i18n";
import legal from "./LegalPage.module.css";
import { ChannelLink } from "./NavLinks";
import styles from "./DealsPage.module.css";

const D = "web.deals.";

const FRESH_DROP_MIN_PCT = 5; // below it the drop is shown in EGP, as in the channel
const DAY_MS = 24 * 3600 * 1000;
const ISO_DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** The drop line, or null when the reference day cannot be read (no line beats a dangling one). */
function dropText(locale: Locale, x: DealInsight, deal: PublicDeal): string | null {
  const diff = x.diff ?? 0;
  const amount = diff < FRESH_DROP_MIN_PCT
    ? `${formatEGP((x.ref ?? 0) - deal.price)} ${t(locale, D + "currency")}`
    : `${Math.round(diff)}${locale === "ar" ? "٪" : "%"}`;
  const day = x.refDay ?? "";
  if (day === cairoDay(new Date(new Date(deal.observedAt).getTime() - DAY_MS))) {
    return t(locale, D + "insight.drop_since_prev", { diff: amount, refDay: t(locale, D + "insight.yesterday") });
  }
  if (!ISO_DAY_RE.test(day)) return null;
  return t(locale, D + "insight.drop_since_prev", { diff: amount, refDay: t(locale, D + "insight.priceOn", { day: `${day.slice(8)}/${day.slice(5, 7)}` }) });
}

function insightText(locale: Locale, x: DealInsight, deal: PublicDeal): string | null {
  switch (x.kind) {
    case "low_90d":
      return t(locale, D + "insight.low90");
    case "below_avg30":
      return t(locale, D + "insight.belowAvg", { pct: Math.round(x.diff ?? 0) });
    case "cheaper_than":
      return t(locale, D + "insight.cheaperThan", { diff: formatEGP(x.diff ?? 0), store: x.otherStore ?? "" });
    case "drop_since_prev":
      return dropText(locale, x, deal);
    case "low_30d":
    case "low_all":
    case "team_pick":
      return t(locale, D + "insight." + x.kind);
    case "below_avg_egp":
      return t(locale, D + "insight.below_avg_egp", { diff: formatEGP(x.diff ?? 0) });
    case "low_30d_everyday":
      return t(locale, D + "insight.low_30d_everyday", { diff: Math.round(x.diff ?? 0) });
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
              const insights = d.insights.map((x) => insightText(locale, x, d)).filter((s): s is string => s !== null);
              return (
                <li key={`${d.buyUrl}|${d.observedAt}`} className={styles.row}>
                  <div className={styles.body}>
                    <h2 className={styles.title} dir="auto">{d.title}</h2>
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
