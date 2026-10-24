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

/** The GitPrice mark (logo_icon.svg's paths), drawn in ink as the ToolbarIcon and Badge symbols draw it. */
function Mark() {
  return (
    <svg className={styles.mark16} viewBox="593 360 210 304" width="11" height="16">
      <path fill="currentColor" d="M694.982 564.096C638.749 564.096 593 518.316 593 462.045C593 405.778 638.749 360 694.982 360C751.218 360 796.964 405.778 796.964 462.045C796.964 518.316 751.218 564.096 694.982 564.096ZM694.982 421.117C672.428 421.117 654.078 439.478 654.078 462.045C654.078 484.614 672.428 502.978 694.982 502.978C717.537 502.978 735.89 484.614 735.89 462.045C735.89 439.478 717.537 421.117 694.982 421.117Z" />
      <path fill="currentColor" d="M694.983 360H802.541V421.116H694.983V360Z" />
      <path fill="currentColor" d="M694.983 663.053C669.893 663.053 645.402 658.475 622.194 649.445L644.329 592.486C676.573 605.029 713.392 605.029 745.624 592.492L767.755 649.451C744.553 658.48 720.068 663.053 694.983 663.053Z" />
    </svg>
  );
}

/** Welcome step 1: Chrome's puzzle piece, the pin, and the toolbar icon with its check pill (WebIcon/puzzle, WebIcon/pin, ToolbarIcon/cheapest). */
export function PinStepArt() {
  return (
    <div className={styles.welcomeIcons} aria-hidden="true" data-art="welcome-pin">
      <svg className={styles.puzzle} viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round">
        <path d="M10 3.5a2 2 0 1 1 4 0V6h4v4h-1.5a2 2 0 1 0 0 4H18v4h-4v-1.5a2 2 0 1 0-4 0V18H6v-4h1.5a2 2 0 1 0 0-4H6V6h4z" />
      </svg>
      <svg className={styles.pin} viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 17v5M8 3h8l-1 6 3 3v2H6v-2l3-3z" />
      </svg>
      <span className={styles.toolbarIcon}>
        <Mark />
        <span className={styles.toolbarCheck}><Tick small /></span>
      </span>
    </div>
  );
}

/** Welcome step 2: the on-page badge (Badge/ready). Its line is the receipt's "23,749 on Store B" clause plus the row's saving. */
export function BadgeStepArt({ locale }: { locale: Locale }) {
  // receipt.detail is "<price> on <store> · <price> here" in both locales; the badge shows its first clause.
  const offer = t(locale, V + "receipt.detail").split(" · ")[0];
  return (
    <span className={styles.readyBadge} aria-hidden="true" data-art="welcome-badge">
      <Mark />
      <span>{offer} · {t(locale, V + "pricerowcompact.saving")}</span>
    </span>
  );
}
