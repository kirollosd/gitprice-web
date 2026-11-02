/** Token-bearing URL parts, held in memory only. `clicked`: the user already pressed a confirm button for them. */
export type AuthHold = { search: string; hash: string; clicked?: boolean };

declare global {
  interface Window { __gpTake?: () => AuthHold | null }
}

const HOLD_MS = 60_000;
let held: AuthHold | null = null;

/** Client-side navigation handoff (ConfirmEmail to the reset form): module memory, never the URL. */
export function handoff(value: AuthHold): void {
  held = value;
  setTimeout(() => { held = null; }, HOLD_MS);
}

/** What the head script stripped from this page's URL, or what a previous page handed over. Returns it once. */
export function takeAuth(): AuthHold | null {
  const fromScript = window.__gpTake?.() ?? null;
  const value = fromScript ?? held;
  held = null;
  return value;
}
