import { t, type Locale } from "../../lib/i18n";
import { html } from "./html";
import type { Product } from "./products";
import RankSort from "./RankSort";
import { storeTextHtml } from "./StoreMark";
import s from "./Trap.module.css";

const K = "web.landing.trap.";

export type RankRow = { label: string; price: number; exact: boolean; why: string };

/** Every listing in the lineup plus the other store's exact match, cheapest first ("▲ Store · 20W · Black"). */
export function rankRows(P: Product): RankRow[] {
  const ex = P.lineup.find((l) => l[4] === 1)!;
  // drop the shared product or brand prefix so rows fit one line
  const trim = (n: string) =>
    n.startsWith(P.short + " · ") ? n.slice(P.short.length + 3) : n.startsWith(P.brand + " ") ? n.slice(P.brand.length + 1) : n;
  return [
    ...P.lineup.map(([st, n, price, , k, why]) => ({ label: `${st} · ${trim(n)}`, price, exact: k === 1, why: k === 1 ? "" : why ?? "" })),
    { label: `${P.other.store} · ${trim(ex[1])}`, price: P.other.price, exact: true, why: "" },
  ].sort((a, b) => a.price - b.price);
}

/**
 * The trap: a plain price sort puts a look-alike on top. First state: sorted by price, the top row highlighted.
 * RankSort moves #rank rows (classes `first`, `w`, `x`) and flips #tgAll / #tgGp (`on`, aria-pressed).
 * data-dark marks a dark band for the dock and header.
 */
export default function Trap({ locale, product: P }: { locale: Locale; product: Product }) {
  const rows = rankRows(P);
  const cheap = rows.find((r) => !r.exact)!;
  return (
    <section className={s.trap} data-dark="">
      <div>
        <h2>{t(locale, K + "title")}</h2>
        <p id="trapP" dangerouslySetInnerHTML={html(locale, K + "body", {}, { item: storeTextHtml(locale, cheap.label, locale === "ar") })} />
      </div>
      <RankSort rows={rows} locale={locale} />
    </section>
  );
}
