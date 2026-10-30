"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { t, type Locale } from "../../lib/i18n";
import b from "./base.module.css";
import GMark from "./GMark";
import { html } from "./html";
import { applyMoney } from "./money";
import { Price, priceHtml } from "./Price";
import { localize, products, type Product } from "./products";
import { marksHtml, StoreText, storeTextHtml } from "./StoreMark";
import s from "./Room.module.css";

const K = "web.landing.room.";
const ROUNDS = 3;
/** Horizontal travel that counts as a swipe between lineups. */
const SWIPE_PX = 48;
const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Product art is drawn, not photographed: "charger small" → the module's .art.charger.small. */
export function Art({ c }: { c: string }) {
  return <span className={[s.art, ...c.split(" ").map((x) => s[x])].join(" ")} />;
}

/** The verdict under the lineup: who was right (if the visitor picked), then what the exact match costs. */
function verdict(locale: Locale, R: Product, pick: number | null) {
  const ex = R.lineup.findIndex((x) => x[4] === 1), E = R.lineup[ex];
  const lead = pick == null ? "" : (pick === ex ? t(locale, K + "verdictRight") : html(locale, K + "verdictWrong", { reason: R.lineup[pick][5] ?? "" }).__html) + " ";
  const tail = E[2] < R.from
    ? html(locale, K + "verdictCheaper", {}, { price: priceHtml(E[2]), store: storeTextHtml(locale, E[0]), ref: priceHtml(R.from) })
    : html(locale, K + "verdictPricier", {}, { store: storeTextHtml(locale, E[0]) });
  return lead + tail.__html;
}

/**
 * 2c · spot the same one: four suspects, one is the exact product. Round one is the hero product, scrubbed by the
 * scroll (ScrollScenes) until the visitor plays it: a guess or a dot sets #spotpin[data-manual], so
 * the scrub stands down, and folds the pinned runway to the room's height. Rounds two and three are the next
 * products in the list; they deal themselves in. Card states are the classes in, picked, rev and out.
 */
export default function Room({ locale, product: P }: { locale: Locale; product: Product }) {
  const [round, setRound] = useState(0);
  const manual = useRef(false), done = useRef(false), timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const R = useMemo(() => {
    const i = products.findIndex((x) => x.id === P.id);
    return round === 0 ? P : localize(products[(i + round) % products.length], locale);
  }, [round, P, locale]);
  const ref = useRef<HTMLElement>(null);

  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, reduced() ? 0 : ms)); };
  const cards = () => [...(ref.current?.querySelector("#sus")?.children ?? [])] as HTMLElement[];
  // the scroll has nothing left to drive: the runway folds to the room, and the room stays where it was on screen
  const takeOver = () => {
    if (manual.current) return;
    manual.current = true;
    const pin = document.getElementById("spotpin"), room = ref.current;
    if (!pin || !room) return;
    pin.setAttribute("data-manual", "");
    const top = pin.getBoundingClientRect().top;
    pin.style.height = room.offsetHeight + "px";
    if (top < 0) scrollTo(0, scrollY + top);
  };
  const reveal = (pick: number | null) => {
    takeOver();
    cards().forEach((c) => { c.style.transitionDelay = ""; c.classList.add("in"); });
    if (done.current) return;
    done.current = true;
    const ex = R.lineup.findIndex((x) => x[4] === 1);
    cards().forEach((c, k) => {
      c.classList.toggle("picked", k === pick);
      later(() => { c.classList.add("rev"); if (k !== ex) c.classList.add("out"); }, k === ex ? 520 : 120 + k * 80);
    });
    const v = document.getElementById("verdict"), h = document.getElementById("roomh");
    if (v) { v.innerHTML = verdict(locale, R, pick); v.classList.add("on"); applyMoney(v); }
    if (h) h.innerHTML = html(locale, K + (pick === ex ? "right" : "wrong")).__html;
  };
  const goTo = (k: number) => { if (k === round) return; takeOver(); setRound(k); };
  // touch: a horizontal swipe on the wall flips to the neighbouring lineup (mouse users have the dots)
  const swipe = useRef<{ x: number; y: number } | null>(null), swiped = useRef(false);
  const rtl = locale === "ar";
  const onSwipeEnd = (e: PointerEvent<HTMLDivElement>) => {
    const from = swipe.current;
    swipe.current = null;
    if (!from) return;
    const dx = e.clientX - from.x, dy = e.clientY - from.y;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    swiped.current = true;
    const forward = rtl ? dx > 0 : dx < 0;
    goTo(Math.min(ROUNDS - 1, Math.max(0, round + (forward ? 1 : -1))));
  };

  // a new round: reset the verdict and heading, deal the cards in (round one waits for the scroll until played)
  useEffect(() => {
    done.current = false;
    if (round || manual.current) {
      const v = document.getElementById("verdict"), h = document.getElementById("roomh");
      if (v) { v.classList.remove("on"); v.innerHTML = ""; }
      if (h) h.innerHTML = html(locale, K + "title").__html;
      // dealt by CSS delay, not timers: the cards are in from the first frame for anything that reads them
      cards().forEach((c, k) => { c.style.transitionDelay = reduced() ? "" : `${120 + k * 110}ms`; c.classList.add("in"); });
    }
    const ts = timers.current;
    return () => { ts.forEach(clearTimeout); ts.length = 0; };
  }, [round, locale]);

  // round one's scrubbed end: what ScrollScenes writes into #roomh and #verdict
  const scrubDone = verdict(locale, P, null);
  return (
    <section id="room" className={s.room} ref={ref}>
      <div className={s.top}>
        <h2
          id="roomh"
          data-checking={html(locale, K + "checking", { checks: P.checks }).__html}
          data-found={html(locale, K + "found").__html}
          dangerouslySetInnerHTML={html(locale, K + "title")}
        />
        <div className={s.ref}>
          <div className={s.img} id="refimg"><Art c={R.art} /></div>
          <div>
            <small id="refon" dangerouslySetInnerHTML={html(locale, K + "youreOn", {}, { store: storeTextHtml(locale, R.on) })} />
            <div className={s.refname} id="refname">{R.name}</div>
            <div className={`${s.pr} ${b.mono}`} id="refpr"><Price v={R.from} /></div>
          </div>
        </div>
      </div>
      <div
        className={s.wall}
        onPointerDown={(e) => { swipe.current = e.pointerType === "mouse" ? null : { x: e.clientX, y: e.clientY }; swiped.current = false; }}
        onPointerUp={onSwipeEnd}
        onPointerCancel={() => { swipe.current = null; }}
        onClickCapture={(e) => { if (swiped.current) { swiped.current = false; e.stopPropagation(); e.preventDefault(); } }}
      >
        <div className={s.sus} id="sus">
          {R.lineup.map(([store, name, price, art, exact, why], k) => (
            <button key={`${R.id}-${k}`} type="button" className={s.s} data-k={k} data-exact={exact === 1 ? "" : undefined} onClick={() => reveal(k)}>
              <div className={s.img}><Art c={art} /></div>
              {exact === 1 ? (
                <span className={s.stamp}><GMark className={s.eq} state="same" settleOnView label="" />{t(locale, K + "stamp")}</span>
              ) : (
                <span className={`${b.chip} ${s.why}`}><GMark className={s.eq} state="ne" settleOnView label="" />{why}</span>
              )}
              <div className={s.store}><StoreText label={store} locale={locale} /></div>
              <h3>{name}</h3>
              <div className={`${s.pr} ${b.mono}`}><Price v={price} /></div>
            </button>
          ))}
        </div>
      </div>
      <div className={s.lbar}>
        <p className={s.verdict} id="verdict" aria-live="polite" data-done={scrubDone} />
        <div className={s.ctl}>
          <span className={s.dots} id="dots">
            {[0, 1, 2].map((k) => (
              <button key={k} type="button" className={k === round ? "on" : undefined} aria-label={t(locale, K + "lineupN", { n: k + 1, total: ROUNDS })} aria-current={k === round ? "true" : undefined} onClick={() => goTo(k)} />
            ))}
          </span>
        </div>
      </div>
      <p className={s.hint} dangerouslySetInnerHTML={html(locale, "web.landing.spot.note", {}, { marks: marksHtml(locale) })} />
    </section>
  );
}
