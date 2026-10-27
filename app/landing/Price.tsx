import { CUR, money, splitMoney, useMoney } from "./money";
import s from "./Price.module.css";

// Example prices are written in EGP; Rates swaps the formatter, so value and code follow the visitor's currency.
export { CUR, money };

/**
 * A price as one left-to-right unit, "699.00 EGP", so Arabic reads it number first. The value carries data-egp
 * (and data-d) and the code data-cur, for money.ts paintPrice; React renders it through the current formatter.
 */
export function Price({ v, d = 2 }: { v: number; d?: number }) {
  const [value, code] = splitMoney(useMoney()(v, d === 0 ? 0 : 2));
  return (
    <bdi dir="ltr" className={s.p}>
      <span data-egp={v} data-d={d}>{value}</span> <span className={s.cur} data-cur="">{code}</span>
    </bdi>
  );
}

/** The same markup as a string, for copy that carries its own HTML; money.ts applyMoney converts it in place. */
export const priceHtml = (v: number, d = 2) =>
  `<bdi dir="ltr" class="${s.p}"><span data-egp="${v}" data-d="${d}">${money(v, d)}</span> <span class="${s.cur}" data-cur="">${CUR}</span></bdi>`;
