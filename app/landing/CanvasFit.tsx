"use client";

import { useLayoutEffect } from "react";
import { fitCanvas } from "./canvas";

/** Refits the canvas on resize, and on a client-side navigation to the page (where the inline boot script never runs). */
export default function CanvasFit() {
  useLayoutEffect(() => {
    fitCanvas();
    window.addEventListener("resize", fitCanvas);
    return () => window.removeEventListener("resize", fitCanvas);
  }, []);
  return null;
}
