import { useEffect } from "react";

/** Mirrors `on` as a boolean attribute on <html> (the one-coral-CTA rules in globals.css read it); removed on unmount. */
export function useRootFlag(name: string, on: boolean) {
  useEffect(() => { document.documentElement.toggleAttribute(name, on); }, [name, on]);
  useEffect(() => () => document.documentElement.removeAttribute(name), [name]);
}
