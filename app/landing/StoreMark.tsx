import { Fragment } from "react";
import { t, type Locale } from "../../lib/i18n";
import { esc } from "./html";
import s from "./StoreMark.module.css";

/** The example stores are drawn shapes, never names: A circle, B triangle, C square. */
export type Store = "A" | "B" | "C";
const SHAPE = { A: "circle", B: "triangle", C: "square" } as const;
const GLYPH: Record<string, Store> = { "●": "A", "▲": "B", "■": "C" };
const CLS = { A: s.a, B: s.b, C: s.c };

const label = (locale: Locale, store: Store) => t(locale, `web.landing.store.${SHAPE[store]}`);

export function StoreMark({ store, locale }: { store: Store; locale: Locale }) {
  return <i className={`${s.smk} ${CLS[store]}`} role="img" aria-label={label(locale, store)} />;
}

export const markHtml = (locale: Locale, store: Store) =>
  `<i class="${s.smk} ${CLS[store]}" role="img" aria-label="${esc(label(locale, store))}"></i>`;

/** The `{marks}` placeholder: all three stores in a row. */
export const marksHtml = (locale: Locale) => (["A", "B", "C"] as const).map((x) => markHtml(locale, x)).join("");

/** "▲ Store · 20W" → { store: "B", rest: " · 20W" }. */
export function parseStore(text: string): { store: Store; rest: string } {
  const m = /^([●▲■]) Store(.*)$/.exec(text);
  if (!m) throw new Error(`not a store label: ${text}`);
  return { store: GLYPH[m[1]], rest: m[2] };
}

/** A store label as mark + "Store" + detail; `bdiRest` isolates the Latin detail (" · <bdi>20W</bdi>"). */
export function StoreText({ label: text, locale, bdiRest }: { label: string; locale: Locale; bdiRest?: boolean }) {
  const { store, rest } = parseStore(text);
  const detail = bdiRest && rest.startsWith(" · ") ? <> · <bdi>{rest.slice(3)}</bdi></> : rest;
  return (
    <Fragment>
      <StoreMark store={store} locale={locale} />
      {t(locale, "web.landing.store.name")}
      {detail}
    </Fragment>
  );
}

export function storeTextHtml(locale: Locale, text: string, bdiRest = false): string {
  const { store, rest } = parseStore(text);
  const detail = bdiRest && rest.startsWith(" · ") ? ` · <bdi>${esc(rest.slice(3))}</bdi>` : esc(rest);
  return markHtml(locale, store) + esc(t(locale, "web.landing.store.name")) + detail;
}
