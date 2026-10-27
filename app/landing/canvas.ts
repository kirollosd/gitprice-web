/**
 * The landing is drawn on a fixed canvas and zoomed to the window, as in the mock (GP_CANVAS).
 * Phones and portrait tablets get the 430px+ phone canvas (html.lp-m); everything else the 1280-1440 desktop one.
 * Zoom is capped (1.25 phone, 1.2 desktop) and the desktop canvas is kept at least 780px tall, so pinned scenes fit.
 * html.lp-short marks wide-but-short windows. Self-contained: it is also inlined as a string before first paint.
 */
export function fitCanvas() {
  const d = document.documentElement, w = d.clientWidth, h = window.innerHeight || d.clientHeight;
  const m = w < 760 || (h > w && w < 1100);
  const cw = Math.round(m ? Math.max(430, w / 1.25) : Math.max(1280, Math.min(w, 1440), w / 1.2, (780 * w) / h));
  d.classList.toggle("lp-m", m);
  d.classList.toggle("lp-short", !m && (h * cw) / w < 860);
  d.style.setProperty("--cw", cw + "px");
  d.style.setProperty("--z", String(w / cw));
}

export const CANVAS_BOOT = `(${fitCanvas.toString()})()`;

/**
 * Before first paint, flags a page whose product will change at hydration (no ?p=, or one other than the static HTML's
 * charger) so the product parts stay hidden instead of flashing the charger (Hero.module.css, ProductProvider clears it).
 */
export const PICK_BOOT = '(function(){try{if(new URLSearchParams(location.search).get("p")!=="charger")document.documentElement.dataset.gpPick="1"}catch(e){}})()';
