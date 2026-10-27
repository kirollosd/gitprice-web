import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Server-only (reads the file at build time). GP_THEME is not NEXT_PUBLIC_, so it never reaches the client bundle.

/** The 28 --gp-web-* token names (without the prefix) that a tone override may set. */
export const TONE_KEYS: readonly string[] = [
  "ground", "ink", "body", "mute", "dim", "line", "raised", "slab", "fill", "on-fill", "acc", "save",
  "dark", "dark-2", "dark-3", "dark-line", "on-dark", "on-dark-mute", "dark-dim", "dock", "on-dock", "dock-save",
  "accd", "fd", "onfd", "accl", "savel", "logo",
];

type Mode = "light" | "dark";
export type ToneConfig = { light?: Partial<Record<string, string>>; dark?: Partial<Record<string, string>> };

const MODES: readonly Mode[] = ["light", "dark"];
// The values end up inside a <style> tag: only plain hex or rgb()/rgba() with digits, so no `;`, `}` or `<` can get in.
const COLOR = [/^#[0-9a-f]{3,8}$/i, /^rgba?\(\s*[\d.\s,%]+\)$/i];

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function validate(raw: unknown, from: string): ToneConfig {
  if (!isObject(raw)) throw new Error(`theme: ${from} must be an object`);
  const out: ToneConfig = {};
  for (const [mode, tones] of Object.entries(raw)) {
    if (mode === "$comment") continue;
    if (!MODES.includes(mode as Mode)) throw new Error(`theme: unknown mode ${mode} in ${from}`);
    if (!isObject(tones)) throw new Error(`theme: ${mode} in ${from} must be an object`);
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(tones)) {
      if (!TONE_KEYS.includes(k)) throw new Error(`theme: unknown key ${k} in ${mode}`);
      if (typeof v !== "string" || !COLOR.some((re) => re.test(v))) throw new Error(`theme: ${mode}.${k} is not a color`);
      clean[k] = v;
    }
    out[mode as Mode] = clean;
  }
  return out;
}

/** The file's tones, then GP_THEME (same JSON shape) on top. Throws on an unknown key or a non-colour value. */
export function readToneConfig(src: Record<string, string | undefined> = process.env, file = "theme.config.json"): ToneConfig {
  const base = validate(JSON.parse(readFileSync(resolve(process.cwd(), file), "utf8")), file);
  let env: ToneConfig = {};
  if (src.GP_THEME) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(src.GP_THEME);
    } catch {
      throw new Error("theme: GP_THEME is not valid JSON");
    }
    env = validate(parsed, "GP_THEME");
  }
  const out: ToneConfig = {};
  for (const m of MODES) if (base[m] || env[m]) out[m] = { ...base[m], ...env[m] };
  return out;
}

const decls = (tones: Partial<Record<string, string>> = {}) =>
  Object.entries(tones).map(([k, v]) => `--gp-web-${k}:${v}`).join(";");

/**
 * CSS for the overrides, on the three selectors of the synced web blocks. `html` raises each by one element so the
 * override wins whatever order Next puts this <style> and the stylesheet in, while dark still beats a light override.
 */
export function toneCss(c: ToneConfig): string {
  const light = decls(c.light);
  const dark = decls(c.dark);
  return [
    light && `html[data-gp="web"]{${light}}`,
    dark && `html[data-gp="web"][data-theme="dark"]{${dark}}`,
    dark && `@media (prefers-color-scheme: dark){html[data-gp="web"]:not([data-theme="light"]){${dark}}}`,
  ].filter(Boolean).join("\n");
}

/** Inline, before first paint: a remembered "light"/"dark" choice sets data-theme; otherwise the OS media query applies. */
export const THEME_BOOT =
  'try{var t=localStorage.getItem("gp-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}';
