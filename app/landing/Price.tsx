import s from "./Price.module.css";

/** Example prices are written in EGP; Rates (Task 5) swaps value and code client-side through data-egp / data-cur. */
export const CUR = "EGP";
export const money = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export function Price({ v, d = 2 }: { v: number; d?: number }) {
  return (
    <>
      <bdi data-egp={v} data-d={d}>{money(v, d)}</bdi>
      <span className={s.cur} data-cur="">{CUR}</span>
    </>
  );
}

export const priceHtml = (v: number, d = 2) =>
  `<bdi data-egp="${v}" data-d="${d}">${money(v, d)}</bdi><span class="${s.cur}" data-cur="">${CUR}</span>`;
