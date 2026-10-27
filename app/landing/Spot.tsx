import type { Locale } from "../../lib/i18n";
import type { Product } from "./products";
import Room from "./Room";
import Trap from "./Trap";
import s from "./Spot.module.css";

/** Match challenge: the pinned lineup (#spotpin › #room), then the trap with the sorted ranking (#rank). */
export default function Spot({ locale, product }: { locale: Locale; product: Product }) {
  return (
    <div id="spot" data-gp-section="spot">
      <div id="spotpin" className={s.pin}>
        <Room locale={locale} product={product} />
      </div>
      <Trap locale={locale} product={product} />
    </div>
  );
}
