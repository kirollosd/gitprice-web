import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type Param = { type: string; key?: string; value?: string; list?: Param[]; map?: Param[] };
type Entity = { name: string; type: string; parameter?: Param[] };
type Tag = Entity & { firingTriggerId?: string[]; consentSettings?: { consentStatus: string } };
type Trigger = Entity & { triggerId: string };

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

const googtag = cv.tag.filter((t) => t.type === "googtag");
const events = cv.tag.filter((t) => t.type === "gaawe");

describe("GTM container export", () => {
  it("has one Google Tag for G-SM4YKS90F0 on All Pages", () => {
    expect(googtag).toHaveLength(1);
    expect(param(googtag[0], "tagId")).toBe("G-SM4YKS90F0");
    expect(googtag[0].firingTriggerId).toEqual([ALL_PAGES]);
  });

  it("has exactly one GA4 Event tag per site event", () => {
    expect(events.map((t) => param(t, "eventName")).sort()).toEqual([...EVENTS].sort());
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
    for (const e of [...cv.tag, ...cv.variable]) for (const r of refs(e)) expect(names.has(r), `${e.name} -> {{${r}}}`).toBe(true);
  });

  it("attaches GA4 Event Settings to the Google Tag and every event tag", () => {
    const settings = cv.variable.find((v) => v.name === "GA4 Event Settings");
    expect(settings?.type).toBe("gtes");
    expect(refs(settings!)).toContain("Redacted Page Location");
    for (const t of [...googtag, ...events]) expect(param(t, "eventSettingsVariable"), t.name).toBe("{{GA4 Event Settings}}");
  });

  it("sends locale on every event and percent on scroll_depth", () => {
    for (const t of events) expect(refs(t), t.name).toContain("DLV - locale");
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
