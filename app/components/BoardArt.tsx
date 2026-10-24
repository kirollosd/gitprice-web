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

type Row = { store: string; price: string; cheaper?: boolean };

/** PriceRowCompact: thumb, title and store, price at the inline end; the cheaper row adds the saving. */
function PriceRow({ locale, row }: { locale: Locale; row: Row }) {
  return (
    <li className={row.cheaper ? `${styles.row} ${styles.rowCheaper}` : styles.row}>
      <Thumb />
      <span className={styles.rowText}>
        <span className={styles.rowTitle}>{t(locale, V + "pricerowcompact.title")}</span>
        <span className={styles.rowStore}>{t(locale, V + row.store)}</span>
      </span>
      <span className={styles.rowPrice}>
        <span className={row.cheaper ? styles.figSaving : styles.fig}>{row.price}</span>
        {row.cheaper && <span className={styles.rowSaving}>{t(locale, V + "pricerowcompact.saving")}</span>}
      </span>
    </li>
  );
}

const ROWS: Row[] = [
  { store: "pricerowcompact.store", price: FIG.here },
  { store: "pricerowcompact.store2", price: FIG.cheaper, cheaper: true },
  { store: "pricerowcompact.store3", price: FIG.other },
];

function PriceRows({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <ul className={`${styles.rows} ${className ?? ""}`} role="list">
      {ROWS.map((r) => <PriceRow key={r.store} locale={locale} row={r} />)}
    </ul>
  );
}

/** Check mark (Toast/success, Milestone): a 12x8 jade tick. */
function Tick() {
  return (
    <svg className={styles.tick} viewBox="0 0 12 8" width="12" height="8" fill="none">
      <path d="M1 4l3 3 7-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
                <span className={styles.productTitle}>{t(locale, V + "pricerowcompact.title")}</span>
                <span className={styles.productPrice}>{FIG.here}</span>
                <span className={styles.badge}>{t(locale, V + "pricerowcompact.saving")}</span>
              </div>
            </div>
            <PriceRows locale={locale} className={styles.sidePanel} />
          </div>
        </div>
      </div>
      <div className={styles.receiptFrame}>
        <div className={styles.receipt}>
          <span className={styles.receiptCaption}>{t(locale, V + "pricerowcompact.store2")}</span>
          <span className={styles.receiptAmount}>{t(locale, V + "pricerowcompact.saving")}</span>
        </div>
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
  return (
    <div className={styles.card} aria-hidden="true" data-art="alerts">
      <div className={styles.alert}>
        <div className={styles.alertHead}>
          <Thumb large />
          <span className={styles.rowTitle}>{t(locale, V + "pricerowcompact.title")}</span>
        </div>
        <span className={styles.alertPrice}>{FIG.alert}</span>
        <span className={styles.progress} />
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

/** Feature 3 (history): the savings counter (visual/savingscounter). Its labels and the milestone card have no web keys. */
export function HistoryArt() {
  return (
    <div className={styles.card} aria-hidden="true" data-art="history">
      <div className={styles.counter}>
        <span className={styles.counterAmount}>{FIG.saved}</span>
        <span className={styles.counterMonth}>{FIG.month}</span>
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
            <span className={styles.rivalName}>{t(locale, `${S}${n}.name`)}</span>
            <span className={styles.rivalStores}>{stores}</span>
            <span className={styles.rivalCount}><span className={styles.mark} />{t(locale, `${S}${n}.count`)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
