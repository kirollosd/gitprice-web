/**
 * The landing's scroll scenes, ported from combo.html's frame(): hero price board, how-it-works, film grow,
 * the lineup scrub, the receipt feed and the footer price. Each reads the DOM hooks the section components render
 * (see their doc comments) and writes styles/classes directly, as the mock does; ScrollScenes.tsx drives the loop.
 * A frame reads all layout first (one rect per scene, metrics cached by measure()), then writes: no forced reflows.
 * Every price written here goes through money.ts, so Rates' formatter applies.
 */
import { applyMoney, paintPrice, subscribeMoney } from "./money";

export const seg = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const $ = (id: string) => document.getElementById(id);
const kids = (el: Element | null) => (el ? ([...el.children] as HTMLElement[]) : []);
const css = (el: HTMLElement, prop: string, v: string) => el.style.setProperty(prop, v);

/** Seconds the hero takes 0 → 1 once started (it plays on its own clock; every other scene follows the scroll). */
const HERO_SECS = 3.5;
/** Hero progress at which the dock comes in (the mock's dockIn). */
const DOCK_AT = 0.82;
/** Phones (ship critique): a scrubbed scene left at 0 in view this long plays to its first step. */
export const IDLE_MS = 1200;
const FIRST: Record<string, number> = { spotpin: 0.2, print: 0.22 };
// lineup scrub beats: each look-alike is ruled out in turn, then the exact one is stamped
const CHECK = [0.34, 0.56, 0.78];
const STAMP = 0.97; // late in the runway: once the exact one is stamped there is little scroll left before the next section
// receipt: when each point lights up, and the story bar of points 2-4
const BAR = [[0.22, 0.62], [0.62, 0.9], [0.9, 1]];
const SCENES = ["num", "how", "film", "spotpin", "print", "foot"] as const;

type Play = { d: number; p: number; tgt: number; t: number; floor: number };
/** A scene's layout, read once per frame. */
type Box = { top: number; bottom: number; h: number };
/** Layout that only changes on resize/fonts/content: the board cells and the receipt. */
type Metrics = { cellW: number; digitsW: number; full: number; top0: number; rows: { bottom: number; save: number }[] };

/** The canvas the page is drawn on (canvas.ts): rects come back in screen px, offsets in canvas px; Z converts. */
function canvas() {
  const d = document.documentElement, st = d.style;
  const Z = parseFloat(st.getPropertyValue("--z")) || 1;
  return { Z, CWD: parseFloat(st.getPropertyValue("--cw")) || 1440, isM: d.classList.contains("lp-m"), VH: window.innerHeight / Z };
}

const box = (el: HTMLElement): Box => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, h: el.offsetHeight }; };

function readMetrics(): Metrics {
  const dg = $("digits"), paper = $("paper"), wrap = paper?.parentElement;
  const cols = kids(dg).filter((el) => el.firstElementChild?.tagName === "I");
  const fs = dg ? parseFloat(getComputedStyle(dg).fontSize) || 1 : 1;
  return {
    cellW: cols.length ? cols[cols.length - 1].offsetWidth / fs : 0,
    digitsW: dg?.offsetWidth ?? 0,
    full: paper ? paper.scrollHeight + 12 : 0,
    top0: paper && wrap ? wrap.offsetTop + paper.offsetTop : 0,
    rows: kids($("items")).map((r) => ({ bottom: r.offsetTop + r.offsetHeight, save: +(r.dataset.save ?? 0) })),
  };
}

export function createScenes(reduce: boolean, wake: () => void) {
  const PLAY: Record<string, Play> = {};
  const idleT: Record<string, ReturnType<typeof setTimeout> | undefined> = {};
  let c = canvas();
  let M: Metrics | null = null;
  let tallyS = NaN;
  /** The intro (kickHero) has started: a product swap before that (the one picked at hydration) must not start the hero early. */
  let kicked = false;
  // each swapped element's first (server-rendered) copy; a re-rendered element starts over
  const html0 = new WeakMap<Element, string>();
  const shown = new WeakMap<Element, string>();
  const keep = (id: string) => { const el = $(id); if (el && !html0.has(el)) html0.set(el, el.innerHTML); return el; };
  /** Swap a pre-rendered state in only when the state changes (keeps aria-live quiet), then format its prices. */
  const show = (el: HTMLElement | null, key: string, h: string) => {
    if (!el || shown.get(el) === key) return;
    shown.set(el, key);
    el.innerHTML = h;
    applyMoney(el);
  };

  const progOf = (b: Box, raw = false) => (reduce && !raw ? 1 : clamp(-b.top / c.Z / Math.max(1, b.h - c.VH)));
  const state = (id: string, p: number) => (PLAY[id] ??= { d: p, p, tgt: p, t: performance.now(), floor: 0 });
  const tick = (s: Play) => { const now = performance.now(), dt = Math.min(1 / 30, (now - s.t) / 1000); s.t = now; return dt; };

  // progress is the scroll position, eased over ~120ms; completes at 88% of the runway so the end holds
  function scrubbed(id: string, p: number) {
    const s = state(id, p), dt = tick(s);
    p = Math.max(Math.min(1, p / 0.88), s.floor);
    s.tgt = p;
    s.d = Math.abs(p - s.d) < 1e-3 ? p : s.d + (p - s.d) * (1 - Math.exp(-dt / 0.12));
    return s.d;
  }
  // the hero plays itself forward at a fixed pace once scrolled into (or kicked after load); hurries on a fast flick
  function heroPlayed(b: Box) {
    let p = progOf(b);
    if (reduce) return p;
    if (p === 0 && b.top < innerHeight * 0.4) p = 1e-3;
    const s = state("num", p), dt = tick(s);
    if (p > s.p + 1e-4) s.tgt = 1;
    s.p = p;
    const gap = s.tgt - s.d, step = Math.max(dt / HERO_SECS, Math.max(0, (p - s.d) * Math.sign(gap) - 0.25) * dt * 2.5);
    s.d = Math.abs(gap) <= step ? s.tgt : s.d + Math.sign(gap) * step;
    return s.d;
  }
  const played = (id: string, b: Box) => (reduce ? progOf(b) : scrubbed(id, progOf(b)));

  /** 1 · departures board: columns land right to left on the other store's price, then the tags and caption follow. */
  function hero(p: number, m: Metrics) {
    const dg = $("digits"), strike = $("strike");
    if (!dg || !strike) return;
    const FROM = dg.dataset.from ?? "", TO = (dg.dataset.to ?? "").padStart(FROM.length, " ");
    const cells = kids(dg);
    const cols = cells.map((el, i) => [el, i] as const).filter(([el]) => el.firstElementChild?.tagName === "I");
    const n = cols.length, gap = Math.min(0.06, 0.24 / Math.max(1, n - 1)), end = 0.34 + gap * (n - 1) + 0.18;
    css(strike, "width", Math.min(c.CWD - 60, m.digitsW) + "px");
    css(strike, "transform", `scaleX(${ease(seg(p, 0.08, 0.26))})`);
    css(strike, "opacity", String((1 - 0.7 * seg(p, 0.34, end - 0.04)) * (1 - seg(p, end - 0.04, end))));
    cols.forEach(([cell, i], k) => {
      const a = +FROM[i], b = +TO[i], t = ease(seg(p, 0.34 + (n - 1 - k) * gap, 0.52 + (n - 1 - k) * gap));
      const y = TO[i] === " " ? -mix(a, 10, t) : -mix(a, b + (b < a ? 10 : 0), t) % 10;
      css(cell.firstElementChild as HTMLElement, "transform", `translateY(${y}em)`);
      if (TO[i] === " ") css(cell, "width", (1 - t) * m.cellW + "em");
    });
    cells.forEach((el, i) => {
      if (el.firstElementChild || TO[i] !== " ") return;
      const t = seg(p, 0.34, 0.52);
      css(el, "opacity", String(1 - t));
      css(el, "width", (1 - t) * 0.36 + "em");
    });
    kids($("tags")).forEach((t, i) => t.classList.toggle("on", p > 0.62 + i * 0.06));
    // the dock comes in once the board has landed (Dock reads data-landed on gp:hero)
    const num = $("num"), landed = p > DOCK_AT;
    if (num && num.hasAttribute("data-landed") !== landed) { num.toggleAttribute("data-landed", landed); dispatchEvent(new Event("gp:hero")); }
    const cap = keep("cap");
    if (cap?.dataset.done) show(cap, p > 0.8 ? "done" : "start", p > 0.8 ? cap.dataset.done : html0.get(cap)!);
  }

  /** 2 · how it works: the slab grows in, the browser untilts, three steps swap with story bars. */
  function how(p: number) {
    const sl = $("hslab"), hb = $("hb");
    if (!sl || !hb) return;
    const g = reduce ? 1 : ease(seg(p, 0, 0.2)), m = c.isM;
    css(sl, "left", mix(m ? 12 : 520, 0, g) + "px");
    css(sl, "right", mix(m ? 12 : 40, 0, g) + "px");
    css(sl, "top", mix(m ? 360 : 220, 0, g) + "px");
    css(sl, "bottom", mix(m ? 24 : 120, 0, g) + "px");
    css(sl, "border-radius", mix(44, 0, g) + "px");
    css(hb, "transform", `rotateX(${mix(26, 0, g)}deg) scale(${mix(0.92, 1, g)})`);
    const k = p < 0.36 ? 0 : p < 0.66 ? 1 : 2;
    kids($("steps")).forEach((d, i) => d.classList.toggle("on", i === k));
    document.querySelectorAll<HTMLElement>("#prog b").forEach((b, i) => css(b, "transform", `scaleX(${seg(p, 0.06 + i * 0.3, 0.36 + i * 0.3)})`));
    $("badge")?.classList.toggle("on", p > 0.4);
    $("bnote")?.classList.toggle("on", p > 0.4);
    $("panel")?.classList.toggle("on", p > 0.7);
  }

  /** 2b · the film card grows to the largest 16:9 (phone 4:5) box between header and chapter chips. */
  function film(p: number) {
    const f = $("fframe");
    if (!f) return;
    const g = ease(seg(p, 0, 1)), m = c.isM, W = c.CWD, H = c.VH;
    // DemoVideo sets data-nocut when the phone cut is missing, so the frame falls back to 16:9
    const AR = m && !f.hasAttribute("data-nocut") ? 5 / 4 : 9 / 16;
    const w = mix(m ? 300 : 600, Math.min(W - (m ? 24 : 96), (H - (m ? 214 : 280)) / AR), g), fh = w * AR;
    const set: [string, string][] = [
      ["left", (W - w) / 2 + "px"], ["width", w + "px"], ["right", "auto"], ["bottom", "auto"], ["height", fh + "px"],
      ["top", mix(m ? 360 : 400, m ? (H - fh) / 2 : 100, g) + "px"], ["border-radius", mix(36, 20, g) + "px"], ["transform", `rotate(${mix(-3, 0, g)}deg)`],
    ];
    set.forEach(([k, v]) => css(f, k, v));
    const o = String(1 - seg(p, 0.04, 0.3));
    for (const id of ["fh", "fl"]) { const el = $(id); if (el) css(el, "opacity", o); }
    $("chap")?.classList.toggle("on", g > 0.97);
  }

  /** 2c · round one of the lineup, scrubbed: suspects step in, look-alikes are ruled out, the exact one is stamped. */
  function room(p: number) {
    const pin = $("spotpin"), h = keep("roomh"), v = $("verdict");
    if (!pin || pin.hasAttribute("data-manual") || !h) return;
    const cards = kids($("sus")), ex = cards.findIndex((x) => x.hasAttribute("data-exact"));
    const order = cards.map((_, k) => k).filter((k) => k !== ex), at = (k: number) => (k === ex ? STAMP : CHECK[order.indexOf(k)]);
    cards.forEach((b, k) => {
      b.classList.toggle("in", p > 0.03 + k * 0.05);
      b.classList.toggle("picked", p >= at(k) - 0.1 && p < at(k));
      b.classList.toggle("rev", p >= at(k));
      b.classList.toggle("out", k !== ex && p >= at(k));
    });
    const fin = p >= STAMP;
    v?.classList.toggle("on", fin);
    show(v, fin ? "done" : "none", fin ? v?.dataset.done ?? "" : "");
    const h0 = html0.get(h)!;
    if (fin) show(h, "found", h.dataset.found ?? h0);
    else if (p > 0.22) show(h, "checking", h.dataset.checking ?? h0);
    else show(h, "start", h0);
  }

  /** 3 · the receipt prints across the scene; the copy points light in turn; the tally counts what has printed. */
  function print(p: number, m: Metrics) {
    const paper = $("paper"), wrap = paper?.parentElement;
    if (!paper || !wrap) return;
    const fed = Math.round(m.full * clamp(p));
    css(paper, "--fed", fed + "px");
    css(wrap, "transform", `translateY(${-Math.max(0, fed + m.top0 - c.VH + 80)}px)`);
    const step = p < 0.22 ? 0 : p < 0.62 ? 1 : p < 0.9 ? 2 : 3;
    kids(document.querySelector("#print [data-copy]")).forEach((d, i) => {
      d.classList.toggle("on", i <= step);
      if (i) css(d, "--f", String(clamp((p - BAR[i - 1][0]) / (BAR[i - 1][1] - BAR[i - 1][0]))));
    });
    const s = paper.classList.contains("raw") ? 0 : m.rows.reduce((t, r) => (r.save && r.bottom < fed ? t + r.save : t), 0);
    const n = document.querySelector<HTMLElement>("#tallyN [data-egp]");
    if (n && s !== tallyS) { tallyS = s; n.dataset.egp = String(s); paintPrice(n); }
  }

  /** 5 · the footer price rises 300px → 0 as #foot scrolls in. */
  function foot(b: Box) {
    const w = $("word");
    if (w) css(w, "transform", reduce ? "none" : `translateY(${mix(300, 0, ease(seg(innerHeight - b.top, 0, innerHeight)))}px)`);
  }

  /** Phones: a scrubbed scene sitting at 0 while pinned (its top within reach of the viewport top) for IDLE_MS plays to its first step (ship critique). A sliver at the bottom edge does not count: the receipt would print before the section is there. */
  function idle(B: Partial<Record<string, Box>>) {
    for (const id of Object.keys(FIRST)) {
      const b = B[id];
      if (!b) continue;
      const inView = b.top < innerHeight * 0.15 && b.bottom > 0, s = PLAY[id];
      if (!inView && s) s.floor = 0;
      if (!(c.isM && !reduce && inView && progOf(b, true) === 0 && !s?.floor)) { clearTimeout(idleT[id]); idleT[id] = undefined; continue; }
      idleT[id] ??= setTimeout(() => {
        idleT[id] = undefined;
        const el = $(id);
        c = canvas();
        if (!el || !c.isM || progOf(box(el), true) !== 0) return;
        state(id, 0).floor = FIRST[id];
        wake();
      }, IDLE_MS);
    }
  }

  // Rates swapped the formatter: repaint what this module wrote
  const unsub = subscribeMoney(() => {
    for (const id of ["cap", "roomh", "verdict"]) { const el = $(id); if (el) applyMoney(el); }
    tallyS = NaN;
    M = null; // converted prices change the receipt's widths and the board's cells
    wake();
  });

  return {
    /** Live progress of a scene (reads layout; for use outside a frame). */
    prog: (el: HTMLElement, raw = false) => progOf(box(el), raw),
    /** One frame of every scene; true while any is still travelling to its target. */
    frame() {
      // read phase: every layout read of the frame, before any write
      c = canvas();
      const B: Partial<Record<string, Box>> = {};
      for (const id of SCENES) { const el = $(id); if (el) B[id] = box(el); }
      const m = (M ??= readMetrics());
      // write phase
      if (B.num) hero(heroPlayed(B.num), m);
      if (B.how) how(reduce ? progOf(B.how, true) : played("how", B.how));
      if (B.film) film(played("film", B.film));
      if (B.spotpin) room(played("spotpin", B.spotpin));
      if (B.print) print(played("print", B.print), m);
      if (B.foot) foot(B.foot);
      idle(B);
      return Object.values(PLAY).some((s) => s.d !== s.tgt);
    },
    /** The hero plays itself shortly after load. */
    kickHero() { kicked = true; const s = PLAY.num; if (s && s.tgt < 1) s.tgt = 1; },
    /** Fonts, canvas or content changed: re-measure the board cells and the receipt on the next frame. */
    measure() { M = null; },
    /** A new product is on the page: re-measure, recount the tally and replay the hero from the struck price. */
    reset() {
      M = null;
      tallyS = NaN;
      const s = PLAY.num;
      if (s && !reduce) { s.d = 0; if (kicked) s.tgt = 1; }
    },
    stop() { Object.values(idleT).forEach((t) => clearTimeout(t)); unsub(); },
  };
}
