import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CanvasFit from "../app/landing/CanvasFit";

afterEach(() => { cleanup(); vi.restoreAllMocks(); document.body.innerHTML = ""; });

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
});
