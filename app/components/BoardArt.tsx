import { t, type Locale } from "../../lib/i18n";
import styles from "./BoardArt.module.css";

/*
 * The product mockups the Home and Sellers boards draw (visual/* layers), rebuilt in HTML/CSS.
 * Worded strings come only from web.*.visual.* keys; a board string without a key is left out.
 * The figures below are the board's own sample prices and totals: digits only, no currency, the same in both locales.
 * Every block is decorative (aria-hidden): the page text says the same thing.
 */
const FIG = { here: "24,999", cheaper: "23,749", other: "24,250", alert: "22,900", saved: "4,210", month: "+340" };
const V = "web.home.visual.";

/** A board figure: kept left-to-right inside Arabic text, as the boards isolate it. */
function N({ v, className }: { v: string; className?: string }) {
  return <bdi dir="ltr" className={className}>{v}</bdi>;
}

/** Mockup button: a styled span, never interactive (the art is aria-hidden). */
function Btn({ children, primary }: { children: string; primary?: boolean }) {
  return <span className={primary ? styles.btnPrimary : styles.btnText}>{children}</span>;
}

/** Product photo exported once from the Sketch library (thumb/photo); decorative. */
function Photo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 7 KB static webp at fixed size; next/image adds nothing here
    <img src="/product-headphones.webp" alt="" width={152} height={230} className={`${styles.photo} ${className ?? ""}`} />
  );
}

function Thumb({ large }: { large?: boolean }) {
  return (
    <span className={large ? `${styles.thumb} ${styles.thumbLarge}` : styles.thumb}>
      <Photo />
    </span>
  );
}

/** Check mark (Toast/success, Milestone, Exact match): a jade tick. */
function Tick({ small }: { small?: boolean }) {
  return (
    <svg className={small ? styles.tickSmall : styles.tick} viewBox="0 0 12 8" width="12" height="8" fill="none">
      <path d="M1 4l3 3 7-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Row = { store: string; price: string; cheaper?: boolean; here?: boolean };

/** PriceRowCompact: thumb, title, store with "This page" or "Exact match", price at the inline end; the cheaper row adds the saving. */
function PriceRow({ locale, row }: { locale: Locale; row: Row }) {
  return (
    <li className={row.cheaper ? `${styles.row} ${styles.rowCheaper}` : styles.row}>
      <Thumb />
      <span className={styles.rowText}>
        <span className={styles.rowTitle}>{t(locale, V + "pricerowcompact.title")}</span>
        <span className={styles.rowStore}>
          {t(locale, V + row.store)}
          {row.here ? (
            <span className={styles.muted}>{t(locale, V + "row.thisPage")}</span>
          ) : (
            <span className={styles.match}><Tick small />{t(locale, V + "row.exactMatch")}</span>
          )}
        </span>
      </span>
      <span className={styles.rowPrice}>
        <N v={row.price} className={row.cheaper ? styles.figSaving : styles.fig} />
        {row.cheaper && <span className={styles.rowSaving}>{t(locale, V + "pricerowcompact.saving")}</span>}
      </span>
    </li>
  );
}

const ROWS: Row[] = [
  { store: "pricerowcompact.store", price: FIG.here, here: true },
  { store: "pricerowcompact.store2", price: FIG.cheaper, cheaper: true },
  { store: "pricerowcompact.store3", price: FIG.other },
];

function PriceRows({ locale }: { locale: Locale }) {
  return (
    <ul className={styles.rows} role="list">
      {ROWS.map((r) => <PriceRow key={r.store} locale={locale} row={r} />)}
    </ul>
  );
}

/** SavingsHero: the cheapest same product, the saving, both prices and the two actions. */
function Receipt({ locale, className }: { locale: Locale; className?: string }) {
  const R = V + "receipt.";
  return (
    <div className={`${styles.receipt} ${className ?? ""}`}>
      <span className={styles.receiptCaption}>{t(locale, R + "title")}</span>
      <span className={styles.receiptAmount}>{t(locale, R + "saving")}</span>
      <span className={styles.receiptDetail}>{t(locale, R + "detail")}</span>
      <span className={styles.actions}>
        <Btn primary>{t(locale, R + "go")}</Btn>
        <Btn>{t(locale, R + "alert")}</Btn>
      </span>
    </div>
  );
}

/** Hero: a store page with GitPrice's side panel (visual/browser, visual/store-page), and the receipt card over its corner. */
export function HeroArt({ locale }: { locale: Locale }) {
  return (
    <div className={styles.hero} aria-hidden="true" data-art="hero">
      <div className={styles.browser}>
        <div className={styles.page}>
          <div className={styles.pageBar}>
            <span className={styles.pageStore}>{t(locale, V + "pricerowcompact.store")}</span>
            <span className={styles.search} />
          </div>
          <div className={styles.pageBody}>
            <div className={styles.product}>
              <span className={styles.productShot}><Photo /></span>
              <div className={styles.productInfo}>
                {/* The store page shows the product's full name: the same string as the alert card's. */}
                <span className={styles.productTitle}>{t(locale, V + "alertcard.title")}</span>
                <N v={FIG.here} className={styles.productPrice} />
                <span className={styles.badge}>{t(locale, V + "pricerowcompact.saving")}</span>
              </div>
            </div>
            <div className={styles.sidePanel}>
              <Receipt locale={locale} className={styles.receiptMini} />
              <PriceRows locale={locale} />
            </div>
          </div>
        </div>
      </div>
      <div className={styles.receiptFrame}>
        <Receipt locale={locale} />
      </div>
    </div>
  );
}

/** Feature 1 (rows): the side panel's three price rows (visual/panel + visual/pricerowcompact). */
export function RowsArt({ locale }: { locale: Locale }) {
  return (
    <div className={`${styles.card} ${styles.cardTight}`} aria-hidden="true" data-art="rows">
      <div className={styles.panel}><PriceRows locale={locale} /></div>
    </div>
  );
}

/** Feature 2 (alerts): a triggered alert card and the success toast (visual/alertcard + visual/toast). */
export function AlertsArt({ locale }: { locale: Locale }) {
  const A = V + "alertcard.";
  return (
    <div className={styles.card} aria-hidden="true" data-art="alerts">
      <div className={styles.alert}>
        <div className={styles.alertHead}>
          <Thumb large />
          <span className={styles.alertTitle}>{t(locale, A + "title")}</span>
        </div>
        <div className={styles.stack}>
          <span className={styles.caption}>{t(locale, A + "lastSeen")}</span>
          <span className={styles.line}>
            <N v={FIG.alert} className={styles.fig} />
            <span className={styles.change}>{t(locale, A + "change")}</span>
          </span>
        </div>
        <div className={styles.stack}>
          <span className={styles.between}>
            <span className={styles.small}>{t(locale, A + "target")}</span>
            <span className={styles.reached}>{t(locale, A + "reached")}</span>
          </span>
          <span className={styles.progress} />
        </div>
        <span className={styles.caption}>{t(locale, A + "updated")}</span>
        <span className={`${styles.between} ${styles.foot}`}>
          <Btn>{t(locale, A + "view")}</Btn>
          <span className={styles.line}>
            <Btn>{t(locale, A + "edit")}</Btn>
            <Btn>{t(locale, A + "remove")}</Btn>
          </span>
        </span>
      </div>
      <div className={styles.toast}>
        <Tick />
        <span className={styles.toastText}>{t(locale, V + "toast.message")}</span>
        <svg className={styles.close} viewBox="0 0 10 10" width="10" height="10" fill="none">
          <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

/** Feature 3 (history): the savings counter and the milestone card (visual/savingscounter + visual/milestone). */
export function HistoryArt({ locale }: { locale: Locale }) {
  const C = V + "savingscounter.";
  return (
    <div className={styles.card} aria-hidden="true" data-art="history">
      <div className={styles.counter}>
        <div className={styles.stack}>
          <span className={styles.small}>{t(locale, C + "title")}</span>
          <N v={FIG.saved} className={styles.counterAmount} />
        </div>
        <div className={styles.stack}>
          <span className={styles.line}>
            {t(locale, C + "month")}
            <N v={FIG.month} className={styles.counterMonth} />
          </span>
          <span className={styles.small}>{t(locale, C + "couldHave")}</span>
        </div>
        <span className={`${styles.between} ${styles.foot}`}>
          <span className={styles.small}>{t(locale, C + "orders")}</span>
          <Btn>{t(locale, C + "seeOrders")}</Btn>
        </span>
      </div>
      <div className={styles.milestone}>
        <Tick />
        <span className={styles.stack}>
          <span className={styles.milestoneTitle}>{t(locale, V + "milestone.title")}</span>
          <span className={styles.caption}>{t(locale, V + "milestone.date")}</span>
        </span>
      </div>
    </div>
  );
}

/** Sellers hero: three rival cards (visual/rival/*). */
export function RivalsArt({ locale }: { locale: Locale }) {
  const S = "web.sellers.visual.rival.";
  // The board's "Store A · Store C" line: the two keyed store names, joined.
  const stores = `${t(locale, V + "pricerowcompact.store")} · ${t(locale, V + "pricerowcompact.store3")}`;
  return (
    <div className={styles.card} aria-hidden="true" data-art="rivals">
      <ul className={styles.rivals} role="list">
        {[1, 2, 3].map((n) => (
          <li key={n} className={styles.rival}>
            <span className={styles.between}>
              <span className={styles.rivalName}>{t(locale, `${S}${n}.name`)}</span>
              <span className={styles.caption}>{t(locale, S + "pinned")}</span>
            </span>
            <span className={styles.rivalStores}>{stores}</span>
            <span className={styles.rivalCount}><span className={styles.mark} />{t(locale, `${S}${n}.count`)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
