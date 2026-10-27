"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { createContext, Suspense, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { t, type Locale } from "../../lib/i18n";
import { getProduct, products } from "./products";
import s from "./Hero.module.css";

type Ctx = { id: string; pick: (id: string) => void };
const ProductCtx = createContext<Ctx>({ id: products[0].id, pick: () => {} });

/** The hero product's id (an unknown or missing ?p= is the charger). */
export const useProductId = () => useContext(ProductCtx).id;

/** ?p= after hydration. It renders nothing, so the static HTML (the charger) never waits on the URL. */
function FromUrl({ onId }: { onId: (id: string) => void }) {
  const p = useSearchParams().get("p");
  useEffect(() => { onId(getProduct(p ?? undefined).id); }, [p, onId]);
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
