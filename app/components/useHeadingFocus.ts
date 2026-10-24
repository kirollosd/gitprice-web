import { useEffect, useRef } from "react";

/**
 * Moves focus to the heading when `view` changes, so a keyboard or screen-reader user lands on the new
 * view. The first view is the load itself, so leaving it never moves focus (the reset form autofocuses
 * its input there). Focus that is already on a real control is left alone; only focus lost to the body
 * (a button that unmounted) is recovered.
 */
export function useHeadingFocus(view: string) {
  const ref = useRef<HTMLHeadingElement>(null);
  const initial = useRef(view);
  const previous = useRef(view);
  useEffect(() => {
    if (previous.current === view) return; // first run, and StrictMode's second
    const fromLoad = previous.current === initial.current;
    previous.current = view;
    const active = document.activeElement;
    if (!fromLoad && (!active || active === document.body)) ref.current?.focus();
  }, [view]);
  return ref;
}
