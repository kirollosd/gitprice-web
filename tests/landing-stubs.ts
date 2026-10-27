import { vi } from "vitest";

/** IntersectionObservers created since the last reset, so a test can drive them with intersect(). */
export const ios: { cb: IntersectionObserverCallback; els: Element[] }[] = [];

/** matchMedia (reduced motion on or off, everything else false) and a capturing IntersectionObserver. */
export function stubMotion(reduce = false) {
  ios.length = 0;
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: reduce && q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      els: Element[] = [];
      constructor(cb: IntersectionObserverCallback) { ios.push({ cb, els: this.els }); }
      observe(el: Element) { this.els.push(el); }
      unobserve() {}
      disconnect() { this.els.length = 0; }
    },
  );
}

export const intersect = (el: Element, on = true) =>
  ios.filter((o) => o.els.includes(el)).forEach((o) => o.cb([{ target: el, isIntersecting: on } as IntersectionObserverEntry], {} as IntersectionObserver));
