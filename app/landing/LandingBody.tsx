"use client";

import { Fragment, useLayoutEffect, useMemo, useRef } from "react";
import type { Locale } from "../../lib/i18n";
import Alerts from "./Alerts";
import Film from "./Film";
import Foot from "./Foot";
import Hero from "./Hero";
import How from "./How";
import Print from "./Print";
import { ProductProvider, useProductId } from "./ProductPicker";
import { getProduct, localize } from "./products";
import Rates from "./Rates";
import Spot from "./Spot";

/** gp:product: the content changed under the scenes (re-measure, replay the hero) and Rates (repaint copy prices). */
function Sections({ locale }: { locale: Locale }) {
  const id = useProductId();
  const P = useMemo(() => localize(getProduct(id), locale), [id, locale]);
  const last = useRef(id);
  // after the new product's DOM is committed and before it paints
  useLayoutEffect(() => {
    if (last.current === id) return;
    last.current = id;
    dispatchEvent(new Event("gp:product"));
  }, [id]);
  return (
    <>
      <Hero locale={locale} product={P} />
      {/* every other section is product-specific end to end: rebuilt per product, as the mock's apply() does */}
      <Fragment key={P.id}>
        <How locale={locale} product={P} />
        <Film locale={locale} product={P} />
        <Spot locale={locale} product={P} />
        <Print locale={locale} product={P} />
        <Alerts locale={locale} product={P} />
        <Foot locale={locale} product={P} />
      </Fragment>
    </>
  );
}

/** The landing's sections, client-rendered around the picked product (static HTML is the charger). */
export default function LandingBody({ locale }: { locale: Locale }) {
  return (
    <ProductProvider>
      <Sections locale={locale} />
      <Rates />
    </ProductProvider>
  );
}
