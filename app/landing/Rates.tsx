"use client";

import { useEffect } from "react";
import { applyMoney, money, setMoneyFormat, subscribeMoney } from "./money";

/**
 * Example prices are written in EGP and shown in the visitor's currency, with its ISO code (owner, 2026-10-27).
 * The currency comes from ?cur=, then the time zone, then the browser region (combo.html's CUR). Rates are the
 * visitor's cached daily table if fresh, else the built-in one; a background fetch refreshes the cache for the
 * next visit, so prices never change under the visitor. Anything off (network, shape, range) falls back silently.
 */
export const RATE_URLS = [
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/egp.min.json",
  "https://latest.currency-api.pages.dev/v1/currencies/egp.min.json",
];
const RATE_KEY = "gp-rates";
const DAY = 864e5;
/** A fetched or cached rate counts only within this factor of the built-in one. */
const SANE = 5;
/** EGP → currency, built in 2026-10-26. */
export const RATE: Readonly<Record<string, number>> = {
  EGP: 1, AED: 0.0668, SAR: 0.0682, KWD: 0.00565, QAR: 0.0662, BHD: 0.00684, OMR: 0.007, JOD: 0.0129,
  MAD: 0.179, TND: 0.0546, DZD: 2.45, IQD: 27.5, LBP: 1630, USD: 0.0182, EUR: 0.0162, GBP: 0.0136,
};
const TZ_CUR: Record<string, string> = {
  Cairo: "EGP", Dubai: "AED", Riyadh: "SAR", Kuwait: "KWD", Qatar: "QAR", Bahrain: "BHD", Muscat: "OMR", Amman: "JOD",
  Casablanca: "MAD", Tunis: "TND", Algiers: "DZD", Baghdad: "IQD", Beirut: "LBP", London: "GBP",
};
const REGION_CUR: Record<string, string> = {
  EG: "EGP", AE: "AED", SA: "SAR", KW: "KWD", QA: "QAR", BH: "BHD", OM: "OMR", JO: "JOD", MA: "MAD", TN: "TND",
  DZ: "DZD", IQ: "IQD", LB: "LBP", GB: "GBP", DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR", NL: "EUR", IE: "EUR",
};

export function pickCurrency(search: string, timeZone: string, language: string): string {
  const q = new URLSearchParams(search).get("cur");
  if (q && RATE[q]) return q;
  const city = timeZone.split("/").pop() ?? "";
  if (TZ_CUR[city]) return TZ_CUR[city];
  if (timeZone.startsWith("Europe/")) return "EUR";
  return REGION_CUR[(language.split("-")[1] ?? "").toUpperCase()] ?? "USD";
}

const sane = (code: string, v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v > 0 && v <= RATE[code] * SANE && v >= RATE[code] / SANE;

/** The known currencies from a fetched `{ egp: { usd: 0.0182, … } }`, numbers only, near the built-in rate. */
export function parseRates(json: unknown): Record<string, number> {
  const egp = (json as { egp?: unknown } | null)?.egp;
  if (!egp || typeof egp !== "object") return {};
  const out: Record<string, number> = {};
  for (const code of Object.keys(RATE)) {
    const v = (egp as Record<string, unknown>)[code.toLowerCase()];
    if (code !== "EGP" && sane(code, v)) out[code] = v;
  }
  return out;
}

/** The cached table, if it is under a day old and every value passes the same checks. */
export function readCache(raw: string | null, now: number): Record<string, number> {
  try {
    const c = JSON.parse(raw ?? "null") as { at?: unknown; r?: unknown } | null;
    if (!c || typeof c.at !== "number" || now - c.at >= DAY || !c.r || typeof c.r !== "object") return {};
    return parseRates({ egp: Object.fromEntries(Object.entries(c.r).map(([k, v]) => [k.toLowerCase(), v])) });
  } catch {
    return {};
  }
}

async function refresh() {
  for (const url of RATE_URLS) {
    try {
      const res = await fetch(url, { credentials: "omit", referrerPolicy: "no-referrer" });
      if (!res.ok) continue;
      const r = parseRates(await res.json());
      if (!Object.keys(r).length) continue;
      try { localStorage.setItem(RATE_KEY, JSON.stringify({ at: Date.now(), r })); } catch { /* storage blocked */ }
      return;
    } catch {
      // next URL; on the last one the built-in rates simply stay
    }
  }
}

function cached(): Record<string, number> {
  try { return readCache(localStorage.getItem(RATE_KEY), Date.now()); } catch { return {}; }
}

/** Mounted once on the landing: sets the converting formatter and repaints the prices that live in copy HTML. */
export default function Rates() {
  useEffect(() => {
    let zone = "";
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ""; } catch { /* no Intl zone */ }
    const code = pickCurrency(location.search, zone, navigator.language ?? "");
    // React-rendered prices follow useMoney; copy HTML (priceHtml) is repainted here, after React has committed
    let raf = 0;
    const repaint = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => applyMoney(document)); };
    const unsub = subscribeMoney(repaint);
    const now = () => applyMoney(document);
    addEventListener("gp:product", now);
    if (code !== "EGP") {
      const table = cached();
      const rate = table[code] ?? RATE[code];
      setMoneyFormat((egp, d) => {
        const x = egp * rate;
        return `${money(x >= 1000 ? Math.round(x) : x, d)} ${code}`;
      });
      // the next visit gets today's rates; Egyptian visitors never need them
      if (!Object.keys(table).length) void refresh();
    }
    return () => {
      cancelAnimationFrame(raf);
      unsub();
      removeEventListener("gp:product", now);
      setMoneyFormat(null);
    };
  }, []);
  return null;
}
