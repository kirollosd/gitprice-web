/**
 * How the landing shows a price written in EGP. The default is the base figure with its ISO code ("699.00 EGP");
 * Rates (Task 5b) swaps in a converting formatter with setMoneyFormat, and every client writer (ScrollScenes)
 * formats through formatMoney and repaints on subscribeMoney. Contract: a formatter returns "<value> <CODE>".
 */
import { useSyncExternalStore } from "react";

/** Example prices are written in EGP. */
export const CUR = "EGP";
export const money = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

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

export const getMoneyFormat = () => fmt;

/** The current formatter, re-rendering on a swap; the server and hydration pass use the base (EGP). */
export const useMoney = () => useSyncExternalStore(subscribeMoney, getMoneyFormat, () => base);

/** "699.00 EGP" → ["699.00", "EGP"]. */
export function splitMoney(out: string): [string, string] {
  const i = out.lastIndexOf(" ");
  return i < 0 ? [out, ""] : [out.slice(0, i), out.slice(i + 1)];
}

export function subscribeMoney(cb: () => void): () => void {
  subs.add(cb);
  return () => { subs.delete(cb); };
}

/** Repaint one Price (<bdi data-egp data-d> + its [data-cur] sibling) through the current formatter. */
export function paintPrice(el: HTMLElement) {
  const [value, code] = splitMoney(formatMoney(+(el.dataset.egp ?? 0), el.dataset.d === "0" ? 0 : 2));
  if (el.textContent !== value) el.textContent = value;
  const cur = el.nextElementSibling;
  if (cur instanceof HTMLElement && cur.hasAttribute("data-cur") && cur.textContent !== code) cur.textContent = code;
}

export const applyMoney = (root: ParentNode) => root.querySelectorAll<HTMLElement>("[data-egp]").forEach(paintPrice);
