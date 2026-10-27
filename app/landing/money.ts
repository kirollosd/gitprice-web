/**
 * How the landing shows a price written in EGP. The default is the base figure with its ISO code ("699.00 EGP");
 * Rates (Task 5b) swaps in a converting formatter with setMoneyFormat, and every client writer (ScrollScenes)
 * formats through formatMoney and repaints on subscribeMoney. Contract: a formatter returns "<value> <CODE>".
 */
import { CUR, money } from "./Price";

export type MoneyFormat = (egp: number, digits: 0 | 2) => string;

const base: MoneyFormat = (egp, d) => `${money(egp, d)} ${CUR}`;
let fmt: MoneyFormat = base;
const subs = new Set<() => void>();

export const formatMoney = (egp: number, digits: 0 | 2 = 2) => fmt(egp, digits);

/** Swap the formatter (null restores the base) and tell every subscriber to repaint. */
export function setMoneyFormat(fn: MoneyFormat | null) {
  fmt = fn ?? base;
  subs.forEach((cb) => cb());
}

export function subscribeMoney(cb: () => void): () => void {
  subs.add(cb);
  return () => { subs.delete(cb); };
}

/** Repaint one Price (<bdi data-egp data-d> + its [data-cur] sibling) through the current formatter. */
export function paintPrice(el: HTMLElement) {
  const out = formatMoney(+(el.dataset.egp ?? 0), el.dataset.d === "0" ? 0 : 2);
  const i = out.lastIndexOf(" ");
  const value = i < 0 ? out : out.slice(0, i), code = i < 0 ? "" : out.slice(i + 1);
  if (el.textContent !== value) el.textContent = value;
  const cur = el.nextElementSibling;
  if (cur instanceof HTMLElement && cur.hasAttribute("data-cur") && cur.textContent !== code) cur.textContent = code;
}

export const applyMoney = (root: ParentNode) => root.querySelectorAll<HTMLElement>("[data-egp]").forEach(paintPrice);
