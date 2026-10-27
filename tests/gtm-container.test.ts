import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type Param = { type: string; key?: string; value?: string; list?: Param[]; map?: Param[] };
type Entity = { name: string; type: string; parameter?: Param[] };
type Tag = Entity & { firingTriggerId?: string[]; consentSettings?: { consentStatus: string } };
type Trigger = Entity & { triggerId: string; filter?: { type: string; parameter: Param[] }[] };

const raw = readFileSync(join(__dirname, "../docs/analytics/gtm-container.json"), "utf8");
const cv = JSON.parse(raw).containerVersion as {
  tag: Tag[]; trigger: Trigger[]; variable: Entity[]; builtInVariable: { name: string }[];
};
const ALL_PAGES = "2147479553";
const EVENTS = ["waitlist_submit", "cta_click", "store_click", "section_view", "scroll_depth", "locale_switch", "menu_open"];

const param = (e: Entity, key: string) => e.parameter?.find((p) => p.key === key)?.value;
const strings = (ps: Param[] = []): string[] =>
  ps.flatMap((p) => [p.value ?? "", ...strings(p.list), ...strings(p.map)]);
const refs = (e: Entity) => strings(e.parameter).flatMap((s) => [...s.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]));

/** Runs a Custom JavaScript variable with each {{Name}} replaced by the given value, as GTM inlines it. */
const runJsm = (name: string, vars: Record<string, unknown>, globals: Record<string, unknown> = {}) => {
  const js = param(cv.variable.find((v) => v.name === name)!, "javascript")!
    .replace(/\{\{([^}]+)\}\}/g, (_, n: string) => JSON.stringify(vars[n]));
  return new Function(...Object.keys(globals), `return (${js})();`)(...Object.values(globals));
};

const googtag = cv.tag.filter((t) => t.type === "googtag");
const events = cv.tag.filter((t) => t.type === "gaawe");

describe("GTM container export", () => {
  it("has one Google Tag for G-SM4YKS90F0 on All Pages", () => {
    expect(googtag).toHaveLength(1);
    expect(param(googtag[0], "tagId")).toBe("G-SM4YKS90F0");
    expect(googtag[0].firingTriggerId).toEqual([ALL_PAGES]);
  });

  it("has exactly one GA4 Event tag per site event, plus page_view", () => {
    expect(events.map((t) => param(t, "eventName")).sort()).toEqual([...EVENTS, "page_view"].sort());
  });

  it("sends SPA page views from a History Change trigger, so page_location is recomputed per fire", () => {
    const pv = events.find((t) => param(t, "eventName") === "page_view")!;
    const trig = cv.trigger.find((t) => t.triggerId === pv.firingTriggerId![0])!;
    expect(trig.type).toBe("HISTORY_CHANGE");
  });

  it("skips replaceState history changes so Next.js hydration does not double-count page_view", () => {
    const trig = cv.trigger.find((t) => t.type === "HISTORY_CHANGE")!;
    expect(trig.filter).toContainEqual({ type: "EQUALS", parameter: [
      { type: "TEMPLATE", key: "arg0", value: "{{History Source}}" },
      { type: "TEMPLATE", key: "arg1", value: "replaceState" },
      { type: "BOOLEAN", key: "negate", value: "true" },
    ] });
    expect(cv.builtInVariable.map((v) => v.name)).toContain("History Source");
  });

  it("fires the History Change trigger only when the path or query changed", () => {
    const trig = cv.trigger.find((t) => t.type === "HISTORY_CHANGE")!;
    expect(trig.filter).toHaveLength(2);
    expect(trig.filter).toContainEqual({ type: "EQUALS", parameter: [
      { type: "TEMPLATE", key: "arg0", value: "{{History Page Changed}}" },
      { type: "TEMPLATE", key: "arg1", value: "true" },
    ] });
    expect(cv.variable.find((v) => v.name === "History Page Changed")?.type).toBe("jsm");
  });

  describe("History Page Changed", () => {
    const changed = (oldUrl: unknown, newUrl: unknown) =>
      runJsm("History Page Changed", { "DLV - gtm.oldUrl": oldUrl, "DLV - gtm.newUrl": newUrl });
    it.each([
      ["https://gitprice.com/", "https://gitprice.com/#features", false],
      ["https://gitprice.com/#features", "https://gitprice.com/", false],
      ["https://gitprice.com/ar", "https://gitprice.com/ar#waitlist", false],
      ["https://gitprice.com/", "https://gitprice.com/sellers", true],
      ["https://gitprice.com/", "https://gitprice.com/ar", true],
      ["https://gitprice.com/sellers", "https://gitprice.com/sellers?utm_source=x", true],
      [undefined, "https://gitprice.com/sellers", false],
    ])("%s -> %s is %s", (o, n, expected) => expect(changed(o, n)).toBe(expected));
  });

  it("fires every tag on a defined trigger", () => {
    const ids = new Set([...cv.trigger.map((t) => t.triggerId), ALL_PAGES]);
    for (const t of cv.tag) {
      expect(t.firingTriggerId?.length, t.name).toBeGreaterThan(0);
      for (const id of t.firingTriggerId ?? []) expect(ids.has(id), `${t.name} -> ${id}`).toBe(true);
    }
  });

  it("resolves every {{reference}} in tags and variables", () => {
    const names = new Set([...cv.variable, ...cv.builtInVariable].map((v) => v.name));
    const filters = cv.trigger.map((t) => ({ ...t, parameter: (t.filter ?? []).flatMap((f) => f.parameter).concat(t.parameter ?? []) }));
    for (const e of [...cv.tag, ...cv.variable, ...filters]) for (const r of refs(e)) expect(names.has(r), `${e.name} -> {{${r}}}`).toBe(true);
  });

  it("keeps entity ids unique and matches the README import counts", () => {
    for (const [list, key] of [[cv.tag, "tagId"], [cv.trigger, "triggerId"], [cv.variable, "variableId"]] as const) {
      const ids = list.map((e) => (e as unknown as Record<string, string>)[key]);
      expect(new Set(ids).size, key).toBe(ids.length);
    }
    const readme = readFileSync(join(__dirname, "../docs/analytics/README.md"), "utf8");
    expect(readme).toContain(`add ${cv.tag.length} tags, ${cv.trigger.length} triggers and ${cv.variable.length} variables`);
  });

  it("attaches GA4 Event Settings to the Google Tag and every event tag", () => {
    const settings = cv.variable.find((v) => v.name === "GA4 Event Settings");
    expect(settings?.type).toBe("gtes");
    expect(refs(settings!)).toContain("Redacted Page Location");
    for (const t of [...googtag, ...events]) expect(param(t, "eventSettingsVariable"), t.name).toBe("{{GA4 Event Settings}}");
  });

  it("sends locale on every event and percent on scroll_depth", () => {
    const urlBound = ["page_view", "scroll_depth"];
    for (const t of events) {
      expect(refs(t), t.name).toContain(urlBound.includes(param(t, "eventName")!) ? "Page Locale" : "DLV - locale");
    }
    const scroll = events.find((t) => param(t, "eventName") === "scroll_depth")!;
    expect(refs(scroll)).toContain("Scroll Depth Threshold");
    const trig = cv.trigger.find((t) => t.triggerId === scroll.firingTriggerId![0])!;
    expect(trig.type).toBe("SCROLL_DEPTH");
    expect(param(trig, "verticalThresholdsPercent")).toBe("25,50,75,90");
  });

  it("leaves GA tags under built-in consent checks with no additional consent", () => {
    for (const t of [...googtag, ...events]) expect(t.consentSettings?.consentStatus, t.name).toBe("NOT_NEEDED");
    expect(raw).not.toMatch(/ad_storage[\s\S]{0,80}granted/);
  });

  it("also sets the redacted page_location in the Google Tag's configuration settings", () => {
    const table = googtag[0].parameter!.find((p) => p.key === "configSettingsTable")!;
    expect(table.list!.map((r) => r.map!.map((m) => m.value))).toContainEqual(["page_location", "{{Redacted Page Location}}"]);
  });

  it("sends locale from the current URL on every tag through GA4 Event Settings", () => {
    const settings = cv.variable.find((v) => v.name === "GA4 Event Settings")!;
    const rows = settings.parameter!.find((p) => p.key === "eventSettingsTable")!.list!.map((r) => r.map!.map((m) => m.value));
    expect(rows).toContainEqual(["locale", "{{Page Locale}}"]);
    expect(cv.variable.find((v) => v.name === "Page Locale")?.type).toBe("jsm");
    expect(cv.builtInVariable.map((v) => v.name)).toContain("Page Path");
  });

  describe("Page Locale", () => {
    it.each([
      ["/", "en"], ["/sellers", "en"], ["/ar", "ar"], ["/ar/", "ar"], ["/ar/sellers", "ar"], ["/arabic", "en"], ["/about/ar", "en"],
    ])("%s -> %s", (path, expected) => expect(runJsm("Page Locale", { "Page Path": path })).toBe(expected));
  });

  describe("Redacted Page Location", () => {
    const js = param(cv.variable.find((v) => v.name === "Redacted Page Location")!, "javascript")!;
    const run = (href: string) => {
      const u = new URL(href);
      return new Function("location", `return (${js})();`)({ href: u.href, origin: u.origin, pathname: u.pathname });
    };

    it.each([
      ["https://gitprice.com/ar/reset-password?x#token=abc", "https://gitprice.com/ar/reset-password"],
      ["https://gitprice.com/checkout/return#t", "https://gitprice.com/checkout/return"],
      ["https://gitprice.com/checkout?h=1", "https://gitprice.com/checkout"],
      ["https://gitprice.com/welcome/?a=b", "https://gitprice.com/welcome/"],
      ["https://gitprice.com/sellers?utm_source=x", "https://gitprice.com/sellers?utm_source=x"],
      ["https://gitprice.com/ar?utm_source=x#faq", "https://gitprice.com/ar?utm_source=x#faq"],
    ])("%s -> %s", (href, expected) => expect(run(href)).toBe(expected));
  });
});
