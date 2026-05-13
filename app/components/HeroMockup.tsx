import styles from "./HeroMockup.module.css";

interface ComparisonRow {
  store: string;
  price: string;
  savings?: string;
  isBest?: boolean;
}

const ROWS: ComparisonRow[] = [
  { store: "Amazon.eg", price: "EGP 1,299", isBest: true },
  { store: "Noon", price: "EGP 1,450", savings: "11%" },
  { store: "Jumia", price: "EGP 1,520", savings: "17%" },
];

/**
 * Static browser-window mockup illustrating the GitPrice popup UI.
 * Purely presentational — no client-side JS needed.
 */
export default function HeroMockup() {
  return (
    <div className={styles.browser} aria-hidden="true">
      {/* Browser chrome */}
      <div className={styles.chrome}>
        <div className={styles.dots}>
          <span className={styles.dot} data-color="red" />
          <span className={styles.dot} data-color="yellow" />
          <span className={styles.dot} data-color="green" />
        </div>
        <div className={styles.addressBar}>amazon.eg/dp/B0CXYZ1234</div>
        <div className={styles.extIcon}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2a7.2 7.2 0 01-6-3.22c.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08A7.2 7.2 0 0112 19.2z"
              fill="#34d399"
            />
          </svg>
        </div>
      </div>

      {/* Page body (blurred Amazon stub) */}
      <div className={styles.page}>
        <div className={styles.pageContent}>
          <div className={styles.skeleton} style={{ width: "65%", height: 12 }} />
          <div className={styles.skeleton} style={{ width: "45%", height: 10 }} />
          <div className={styles.skeleton} style={{ width: "30%", height: 18 }} />
        </div>

        {/* GitPrice popup panel */}
        <div className={styles.popup}>
          <div className={styles.popupHeader}>
            <span className={styles.popupLogo}>GitPrice</span>
            <span className={styles.popupBadge}>3 stores</span>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Store</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr
                  key={row.store}
                  className={row.isBest ? styles.bestRow : ""}
                >
                  <td className={styles.storeName}>{row.store}</td>
                  <td className={styles.price}>{row.price}</td>
                  <td>
                    {row.isBest ? (
                      <span className={styles.bestTag}>Best</span>
                    ) : row.savings ? (
                      <span className={styles.savingsTag}>+{row.savings}</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button className={styles.goBtn}>Go to Amazon →</button>
        </div>
      </div>
    </div>
  );
}
