"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { createContext, Suspense, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { t, type Locale } from "../../lib/i18n";
import { products } from "./products";
import s from "./Hero.module.css";

type Ctx = { id: string; pick: (id: string) => void };
const ProductCtx = createContext<Ctx>({ id: products[0].id, pick: () => {} });

/** The hero product's id (an unknown or missing ?p= is the charger). */
export const useProductId = () => useContext(ProductCtx).id;

/** The set of ids a ?p= may name; anything else (or nothing) means a random product, as in the mock. */
const known = (p: string | null | undefined) => products.find((x) => x.id === p)?.id;

/**
 * ?p= changes after mount (back/forward). It renders nothing, so the static HTML (the charger) never waits on the URL.
 * No ?p= leaves the product alone: the random pick made on load must not snap back to the charger.
 */
function FromUrl({ onId }: { onId: (id: string) => void }) {
  const id = known(useSearchParams().get("p"));
  useEffect(() => { if (id) onId(id); }, [id, onId]);
  return null;
}

/**
 * Which product the whole landing shows. ?p=<id> pins one (ads, screenshots); picking a chip writes it back
 * with router.replace, without scrolling. Everything product-specific reads the id from here.
 */
export function ProductProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState(products[0].id);
  const router = useRouter();
  // the last pick whose URL has not landed yet: earlier picks' late commits must not undo it
  const pending = useRef<string | null>(null);
  const fromUrl = useCallback((next: string) => {
    if (pending.current !== null) {
      if (next !== pending.current) return;
      pending.current = null;
    }
    setId(next);
  }, []);
  // The static HTML is the charger. Before the first paint of a hydrated page: ?p= wins, else a random product
  // (the mock's behaviour). HomeSections' boot script hides the product parts (html[data-gp-pick]) until this runs.
  useLayoutEffect(() => {
    setId(known(new URLSearchParams(location.search).get("p")) ?? products[Math.floor(Math.random() * products.length)].id);
    delete document.documentElement.dataset.gpPick;
  }, []);
  const pick = useCallback((next: string) => {
    if (next === id) return;
    pending.current = next;
    setId(next);
    const q = new URLSearchParams(location.search);
    q.set("p", next);
    router.replace(`${location.pathname}?${q}${location.hash}`, { scroll: false });
  }, [id, router]);
  return (
    <ProductCtx.Provider value={{ id, pick }}>
      <Suspense fallback={null}><FromUrl onId={fromUrl} /></Suspense>
      {children}
    </ProductCtx.Provider>
  );
}

/** #pick: "Show it with" and one chip per demo product. */
export default function ProductPicker({ locale }: { locale: Locale }) {
  const { id, pick } = useContext(ProductCtx);
  return (
    <div className={s.pick} id="pick" role="group" aria-labelledby="pickl">
      <small id="pickl">{t(locale, "web.landing.hero.pick")}</small>
      {products.map((x) => (
        <button key={x.id} type="button" data-id={x.id} aria-pressed={x.id === id} className={x.id === id ? "on" : undefined} onClick={() => pick(x.id)}>
          {locale === "ar" ? x.ar.chip : x.chip}
        </button>
      ))}
    </div>
  );
}
