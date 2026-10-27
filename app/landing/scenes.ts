/**
 * The landing's scroll scenes, ported from combo.html's frame(): hero price board, how-it-works, film grow,
 * the lineup scrub, the receipt feed and the footer price. Each reads the DOM hooks the section components render
 * (see their doc comments) and writes styles/classes directly, as the mock does; ScrollScenes.tsx drives the loop.
 */
import { money } from "./Price";

export const seg = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const $ = (id: string) => document.getElementById(id);
const kids = (el: Element | null) => (el ? ([...el.children] as HTMLElement[]) : []);

/** Seconds the hero takes 0 → 1 once started (it plays on its own clock; every other scene follows the scroll). */
const HERO_SECS = 3.5;
/** Phones (ship critique): a scrubbed scene left at 0 in view this long plays to its first step. */
export const IDLE_MS = 1200;
const FIRST: Record<string, number> = { spotpin: 0.2, print: 0.22 };
// lineup scrub beats: each look-alike is ruled out in turn, then the exact one is stamped
const CHECK = [0.32, 0.46, 0.6];
const STAMP = 0.76;
// receipt: when each point lights up, and the story bar of points 2-4
const BAR = [[0.22, 0.62], [0.62, 0.9], [0.9, 1]];

type Play = { d: number; p: number; tgt: number; t: number; floor: number };

/** The canvas the page is drawn on (canvas.ts): rects come back in screen px, offsets in canvas px; Z converts. */
function canvas() {
  const d = document.documentElement, st = d.style;
  const Z = parseFloat(st.getPropertyValue("--z")) || 1;
  return { Z, CWD: parseFloat(st.getPropertyValue("--cw")) || 1440, isM: d.classList.contains("lp-m"), VH: window.innerHeight / Z };
}

/** Swap innerHTML only when it changes (keeps aria-live quiet and saves layout). */
const setHtml = (el: Element | null, h: string) => { if (el && el.innerHTML !== h) el.innerHTML = h; };

export function createScenes(reduce: boolean, wake: () => void) {
  const PLAY: Record<string, Play> = {};
  const idleT: Record<string, ReturnType<typeof setTimeout> | undefined> = {};
  let c = canvas();
  let cellW: number | null = null;
  const html0: Record<string, string> = {};
  const keep = (id: string) => { const el = $(id); if (el && html0[id] == null) html0[id] = el.innerHTML; return el; };

  const prog = (el: HTMLElement, raw = false) => {
    if (reduce && !raw) return 1;
    const r = el.getBoundingClientRect(), h = el.offsetHeight - c.VH;
    return clamp(-r.top / c.Z / Math.max(1, h));
  };
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
  function heroPlayed(el: HTMLElement) {
    let p = prog(el);
    if (reduce) return p;
    if (p === 0 && el.getBoundingClientRect().top < innerHeight * 0.4) p = 1e-3;
    const s = state("num", p), dt = tick(s);
    if (p > s.p + 1e-4) s.tgt = 1;
    s.p = p;
    const gap = s.tgt - s.d, step = Math.max(dt / HERO_SECS, Math.max(0, (p - s.d) * Math.sign(gap) - 0.25) * dt * 2.5);
    s.d = Math.abs(gap) <= step ? s.tgt : s.d + Math.sign(gap) * step;
    return s.d;
  }
  const played = (el: HTMLElement) => (reduce ? prog(el) : scrubbed(el.id, prog(el)));

  /** 1 · departures board: columns land right to left on the other store's price, then the tags and caption follow. */
  function hero(p: number) {
    const dg = $("digits"), strike = $("strike");
    if (!dg || !strike) return;
    const FROM = dg.dataset.from ?? "", TO = (dg.dataset.to ?? "").padStart(FROM.length, " ");
    const cells = kids(dg);
    const cols = cells.map((el, i) => [el, i] as const).filter(([el]) => el.firstElementChild?.tagName === "I");
    if (cellW == null && cols.length) cellW = cols[cols.length - 1][0].offsetWidth / (parseFloat(getComputedStyle(dg).fontSize) || 1);
    const n = cols.length, gap = Math.min(0.06, 0.24 / Math.max(1, n - 1)), end = 0.34 + gap * (n - 1) + 0.18;
    strike.style.transform = `scaleX(${ease(seg(p, 0.08, 0.26))})`;
    strike.style.opacity = String((1 - 0.7 * seg(p, 0.34, end - 0.04)) * (1 - seg(p, end - 0.04, end)));
    cols.forEach(([cell, i], k) => {
      const a = +FROM[i], b = +TO[i], t = ease(seg(p, 0.34 + (n - 1 - k) * gap, 0.52 + (n - 1 - k) * gap));
      const y = TO[i] === " " ? -mix(a, 10, t) : -mix(a, b + (b < a ? 10 : 0), t) % 10;
      (cell.firstElementChild as HTMLElement).style.transform = `translateY(${y}em)`;
      if (TO[i] === " ") cell.style.width = (1 - t) * (cellW ?? 0) + "em";
    });
    cells.forEach((el, i) => {
      if (el.firstElementChild || TO[i] !== " ") return;
      const t = seg(p, 0.34, 0.52);
      el.style.opacity = String(1 - t);
      el.style.width = (1 - t) * 0.36 + "em";
    });
    kids($("tags")).forEach((t, i) => t.classList.toggle("on", p > 0.62 + i * 0.06));
    const cap = keep("cap");
    if (cap?.dataset.done) setHtml(cap, p > 0.8 ? cap.dataset.done : html0.cap);
  }

  /** 2 · how it works: the slab grows in, the browser untilts, three steps swap with story bars. */
  function how(p: number) {
    const sl = $("hslab"), hb = $("hb");
    if (!sl || !hb) return;
    const g = reduce ? 1 : ease(seg(p, 0, 0.2)), m = c.isM;
    sl.style.left = mix(m ? 12 : 520, 0, g) + "px";
    sl.style.right = mix(m ? 12 : 40, 0, g) + "px";
    sl.style.top = mix(m ? 360 : 220, 0, g) + "px";
    sl.style.bottom = mix(m ? 24 : 120, 0, g) + "px";
    sl.style.borderRadius = mix(44, 0, g) + "px";
    hb.style.transform = `rotateX(${mix(26, 0, g)}deg) scale(${mix(0.92, 1, g)})`;
    const k = p < 0.36 ? 0 : p < 0.66 ? 1 : 2;
    kids($("steps")).forEach((d, i) => d.classList.toggle("on", i === k));
    document.querySelectorAll<HTMLElement>("#prog b").forEach((b, i) => { b.style.transform = `scaleX(${seg(p, 0.06 + i * 0.3, 0.36 + i * 0.3)})`; });
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
    Object.assign(f.style, {
      left: (W - w) / 2 + "px", width: w + "px", right: "auto", bottom: "auto", height: fh + "px",
      top: mix(m ? 360 : 400, m ? (H - fh) / 2 : 100, g) + "px", borderRadius: mix(36, 20, g) + "px", transform: `rotate(${mix(-3, 0, g)}deg)`,
    });
    const o = String(1 - seg(p, 0.04, 0.3));
    for (const id of ["fh", "fl"]) { const el = $(id); if (el) el.style.opacity = o; }
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
    setHtml(v, fin ? v?.dataset.done ?? "" : "");
    setHtml(h, fin ? h.dataset.found ?? html0.roomh : p > 0.22 ? h.dataset.checking ?? html0.roomh : html0.roomh);
  }

  /** 3 · the receipt prints across the scene; the copy points light in turn; the tally counts what has printed. */
  function print(p: number) {
    const paper = $("paper"), wrap = paper?.parentElement;
    if (!paper || !wrap) return;
    const full = paper.scrollHeight + 12, fed = Math.round(full * clamp(p));
    paper.style.setProperty("--fed", fed + "px");
    const over = Math.max(0, fed + wrap.offsetTop + paper.offsetTop - c.VH + 80);
    wrap.style.transform = `translateY(${-over}px)`;
    const step = p < 0.22 ? 0 : p < 0.62 ? 1 : p < 0.9 ? 2 : 3;
    kids(document.querySelector("#print [data-copy]")).forEach((d, i) => {
      d.classList.toggle("on", i <= step);
      if (i) d.style.setProperty("--f", String(clamp((p - BAR[i - 1][0]) / (BAR[i - 1][1] - BAR[i - 1][0]))));
    });
    let s = 0;
    if (!paper.classList.contains("raw")) {
      for (const row of kids($("items"))) if (row.dataset.save && row.offsetTop + row.offsetHeight < fed) s += +row.dataset.save;
    }
    const n = document.querySelector<HTMLElement>("#tallyN [data-egp]");
    if (n && n.dataset.egp !== String(s)) { n.dataset.egp = String(s); n.textContent = money(s); }
  }

  /** 5 · the footer price rises 300px → 0 as #foot scrolls in. */
  function foot() {
    const f = $("foot"), w = $("word");
    if (!f || !w) return;
    const t = seg(innerHeight - f.getBoundingClientRect().top, 0, innerHeight);
    w.style.transform = reduce ? "none" : `translateY(${mix(300, 0, ease(t))}px)`;
  }

  /** Phones: a scrubbed scene sitting at 0 while on screen for IDLE_MS plays to its first step (ship critique). */
  function idle() {
    for (const id of Object.keys(FIRST)) {
      const el = $(id);
      if (!el) continue;
      const r = el.getBoundingClientRect(), inView = r.top < innerHeight && r.bottom > 0, s = PLAY[id];
      if (!inView && s) s.floor = 0;
      const waiting = () => c.isM && !reduce && inView && prog(el, true) === 0 && !(PLAY[id]?.floor);
      if (!waiting()) { clearTimeout(idleT[id]); idleT[id] = undefined; continue; }
      idleT[id] ??= setTimeout(() => {
        idleT[id] = undefined;
        c = canvas();
        if (!c.isM || prog(el, true) !== 0) return;
        state(id, 0).floor = FIRST[id];
        wake();
      }, IDLE_MS);
    }
  }

  return {
    prog,
    /** One frame of every scene; true while any is still travelling to its target. */
    frame() {
      c = canvas();
      const num = $("num"), hw = $("how"), fl = $("film"), pin = $("spotpin"), pr = $("print");
      if (num) hero(heroPlayed(num));
      if (hw) how(reduce ? prog(hw, true) : played(hw));
      if (fl) film(played(fl));
      if (pin) room(played(pin));
      if (pr) print(played(pr));
      foot();
      idle();
      return Object.values(PLAY).some((s) => s.d !== s.tgt);
    },
    /** The hero plays itself shortly after load. */
    kickHero() { const s = PLAY.num; if (s && s.tgt < 1) s.tgt = 1; },
    /** Fonts or canvas changed: re-measure the board cells. */
    measure() {
      cellW = null;
      const dg = $("digits"), strike = $("strike");
      if (dg && strike) strike.style.width = Math.min(c.CWD - 60, dg.offsetWidth) + "px";
    },
    stop() { Object.values(idleT).forEach((t) => clearTimeout(t)); },
  };
}
