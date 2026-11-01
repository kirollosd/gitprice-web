import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TOKEN_SCRUB_SCRIPT } from "../lib/scrub";

/** Runs the inline script against a fake window and returns what it did. */
function run(hash: string) {
  const calls: unknown[][] = [];
  const win: Record<string, unknown> = {};
  const location = { hash, pathname: "/auth/confirmed", search: "?lang=ar" };
  const history = { replaceState: (...a: unknown[]) => calls.push(a) };
  new Function("window", "location", "history", TOKEN_SCRUB_SCRIPT)(win, location, history);
  return { calls, win };
}

describe("token fragment scrub script", () => {
  it.each([
    "#access_token=a&refresh_token=b&type=signup",
    "#refresh_token=b",
    "#token_hash=h",
    "#error=access_denied&error_description=Link+expired",
    "#type=recovery",
  ])("removes %s with replaceState, keeping path and query", (hash) => {
    const { calls, win } = run(hash);
    expect(calls).toEqual([[null, "", "/auth/confirmed?lang=ar"]]);
    expect(win.__gpAuthHash).toBe(hash);
  });

  it.each(["", "#", "#pricing", "#section-2"])("leaves %j alone", (hash) => {
    const { calls, win } = run(hash);
    expect(calls).toEqual([]);
    expect(win.__gpAuthHash).toBeUndefined();
  });

  it("is a single synchronous statement list with no async or network", () => {
    expect(TOKEN_SCRUB_SCRIPT).not.toMatch(/setTimeout|fetch|await|addEventListener/);
  });
});

describe("root layout ordering", () => {
  const src = readFileSync(join(__dirname, "../app/[locale]/layout.tsx"), "utf8");
  const at = (needle: string) => {
    const i = src.indexOf(needle);
    expect(i, needle).toBeGreaterThan(-1);
    return i;
  };

  it("emits the scrub as a plain inline <script> in <head> before consent defaults, GTM and every other script", () => {
    const scrub = at("__html: TOKEN_SCRUB_SCRIPT");
    expect(src.slice(src.lastIndexOf("<", scrub), scrub)).toMatch(/^<script /);
    expect(scrub).toBeGreaterThan(at("<head>"));
    for (const later of ['id="gtm-consent"', 'id="gtm"', 'id="gp-theme"', "<Analytics", "<TrackListeners", "gtmScript("]) {
      expect(scrub, later).toBeLessThan(at(later));
    }
  });
});
