import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CanvasFit from "../app/landing/CanvasFit";
import { fitCanvas } from "../app/landing/canvas";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.innerHTML = ""; });

function setup() {
  const sec = document.createElement("section");
  sec.dataset.gpSection = "how";
  sec.getBoundingClientRect = () => ({ top: -100, bottom: 300, height: 400, left: 0, right: 0, width: 0, x: 0, y: -100, toJSON() {} });
  document.body.append(sec);
  const to = vi.fn();
  vi.stubGlobal("scrollTo", to);
  vi.stubGlobal("requestAnimationFrame", (f: FrameRequestCallback) => { f(0); return 1; });
  render(<CanvasFit />);
  act(() => { window.dispatchEvent(new Event("scroll")); }); // tracks the anchor
  return to;
}

describe("CanvasFit", () => {
  it("a height-only resize (phone URL bar) leaves the scroll position alone", () => {
    const to = setup();
    act(() => { window.dispatchEvent(new Event("resize")); });
    expect(to).not.toHaveBeenCalled();
  });
  it("a width change restores the place in the section", () => {
    const to = setup();
    vi.stubGlobal("innerWidth", innerWidth + 200);
    act(() => { window.dispatchEvent(new Event("resize")); });
    expect(to).toHaveBeenCalledTimes(1);
  });
  it("a zoomed-down desktop canvas keeps a 12 rendered px text floor; at z >= 1 there is none", () => {
    const d = document.documentElement;
    vi.stubGlobal("innerHeight", 700);
    vi.spyOn(d, "clientWidth", "get").mockReturnValue(1000);
    fitCanvas();
    expect(parseFloat(d.style.getPropertyValue("--fl"))).toBeCloseTo(15.36, 1); // 12 / (1000 / 1280)
    vi.stubGlobal("innerHeight", 900);
    vi.spyOn(d, "clientWidth", "get").mockReturnValue(1440);
    fitCanvas();
    expect(d.style.getPropertyValue("--fl")).toBe("0px");
  });
});
