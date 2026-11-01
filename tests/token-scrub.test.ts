import { describe, expect, it } from "vitest";
import { TOKEN_SCRUB_SCRIPT } from "../lib/scrub";

/** Runs the inline script against a fake window and returns what it did. */
function run(pathname: string, search = "", hash = "") {
  const calls: unknown[][] = [];
  const timers: [() => void, number][] = [];
  const listeners: Record<string, () => void> = {};
  const state = { router: "state" };
  const win: Record<string, unknown> = {
    location: { pathname, search, hash },
    history: { state, replaceState: (...a: unknown[]) => calls.push(a) },
    addEventListener: (n: string, f: () => void) => (listeners[n] = f),
    setTimeout: (f: () => void, ms: number) => timers.push([f, ms]),
  };
  new Function("window", TOKEN_SCRUB_SCRIPT)(win);
  const take = () => (win.__gpTake as undefined | (() => unknown))?.();
  return { calls, win, state, timers, listeners, take };
}

describe("fragment", () => {
  it.each([
    "#access_token=a&refresh_token=b&type=signup",
    "#refresh_token=b",
    "#provider_token=x",
    "#provider_refresh_token=x",
    "#token_hash=h",
    "#error=access_denied&error_code=otp_expired&error_description=Link+expired",
    "#code=c",
    "#x=1&type=recovery",
  ])("removes %s on any page and keeps history.state", (hash) => {
    const { calls, state } = run("/privacy", "?a=1", hash);
    expect(calls).toEqual([[state, "", "/privacy?a=1"]]);
  });

  it.each(["", "#", "#pricing", "#section-2", "#subtype=1", "#mytype=x", "#prefix_code=1", "#errors=1"])("leaves %j alone", (hash) => {
    expect(run("/privacy", "", hash).calls).toEqual([]);
  });

  it("discards the values on pages that are not auth pages", () => {
    const { win } = run("/", "", "#access_token=a");
    expect(win.__gpTake).toBeUndefined();
  });
});

describe("query on auth and reset paths", () => {
  it.each(["/auth/confirm", "/ar/auth/confirm", "/auth/confirmed", "/reset-password", "/ar/reset-password"])("%s drops token_hash, token, code, type and keeps lang", (path) => {
    const { calls, state } = run(path, "?lang=ar&token_hash=h&type=signup&token=t&code=c&keep=1");
    expect(calls).toEqual([[state, "", `${path}?lang=ar&keep=1`]]);
  });

  it("leaves the same params alone on other paths", () => {
    expect(run("/pricing", "?type=a&code=b").calls).toEqual([]);
    expect(run("/authors", "?code=b").calls).toEqual([]);
  });

  it("drops query and fragment together", () => {
    const { calls, state } = run("/reset-password", "?token_hash=h", "#access_token=a");
    expect(calls).toEqual([[state, "", "/reset-password"]]);
  });
});

describe("one-shot reader", () => {
  it("hands the removed query and fragment over once, then removes itself", () => {
    const { win, take } = run("/auth/confirm", "?token_hash=h&type=signup", "#x");
    expect(Object.getOwnPropertyDescriptor(win, "__gpTake")).toMatchObject({ enumerable: false, writable: false });
    expect(take()).toEqual({ search: "?token_hash=h&type=signup", hash: "#x" });
    expect(win.__gpTake).toBeUndefined();
  });

  it("is not assignable", () => {
    const { win } = run("/reset-password", "?token_hash=h");
    expect(() => { "use strict"; (win as { __gpTake: unknown }).__gpTake = () => "x"; }).toThrow();
  });

  it("is cleared on pagehide", () => {
    const { win, listeners } = run("/reset-password", "?token_hash=h");
    listeners.pagehide();
    expect(win.__gpTake).toBeUndefined();
  });

  it("is cleared after 60 seconds", () => {
    const { win, timers } = run("/reset-password", "?token_hash=h");
    expect(timers).toHaveLength(1);
    expect(timers[0][1]).toBe(60_000);
    timers[0][0]();
    expect(win.__gpTake).toBeUndefined();
  });

  it("does nothing when there was nothing to scrub", () => {
    const { win, timers } = run("/auth/confirmed", "?lang=ar");
    expect(win.__gpTake).toBeUndefined();
    expect(timers).toEqual([]);
  });
});

describe("script shape", () => {
  it("is synchronous with no network", () => {
    expect(TOKEN_SCRUB_SCRIPT).not.toMatch(/fetch|await|XMLHttp/);
  });
});
