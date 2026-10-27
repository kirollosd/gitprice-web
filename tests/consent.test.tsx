import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ar from "../i18n/ar.json";
import en from "../i18n/en.json";
import { ANALYTICS_COOKIE_PREFIXES, consentCookie, cookieExpiries, readConsent } from "../lib/consent";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));
vi.mock("@vercel/analytics/react", () => ({ Analytics: () => <i data-testid="vercel" /> }));
// next/script caches loaded ids module-wide, so stand in a plain element: only our gating is under test.
const scriptMounts = vi.hoisted(() => ({ ids: [] as string[] }));
vi.mock("next/script", async () => {
  const { useEffect } = await import("react");
  function Script({ id }: { id: string }) {
    useEffect(() => { scriptMounts.ids.push(id); }, [id]);
    return <script id={id} />;
  }
  return { default: Script };
});
const mockEnv = vi.hoisted(() => ({ heapId: "12345" as string | undefined }));
vi.mock("../lib/env", () => ({ env: mockEnv }));

const N = en.web.component.webCookieNotice.default;
const reload = vi.fn();

const clearCookies = () =>
  document.cookie.split(";").forEach((c) => { document.cookie = `${c.split("=")[0].trim()}=; Max-Age=0; Path=/`; });

beforeEach(() => {
  clearCookies();
  mockEnv.heapId = "12345";
  scriptMounts.ids.length = 0;
  vi.stubEnv("NODE_ENV", "production");
  reload.mockReset();
  vi.stubGlobal("location", { ...window.location, hostname: "localhost", reload });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("consent cookie helpers", () => {
  it("expires _ga* and _gid cookies on host, hostname and parent, never the TLD or others", () => {
    const out = cookieExpiries("_ga=1; _ga_SM4YKS90F0=2; _gid=3; other=4", "www.gitprice.com", ANALYTICS_COOKIE_PREFIXES);
    for (const n of ["_ga", "_ga_SM4YKS90F0", "_gid"]) {
      expect(out).toContain(`${n}=; Max-Age=0; Path=/`);
      expect(out).toContain(`${n}=; Max-Age=0; Path=/; Domain=www.gitprice.com`);
      expect(out).toContain(`${n}=; Max-Age=0; Path=/; Domain=gitprice.com`);
    }
    expect(out).toHaveLength(9);
    expect(out.some((c) => c.startsWith("other="))).toBe(false);
  });
  it("reads only allow and decline", () => {
    expect(readConsent("a=1; gp_consent=allow")).toBe("allow");
    expect(readConsent("gp_consent=decline")).toBe("decline");
    expect(readConsent("gp_consent=maybe")).toBeNull();
    expect(readConsent("x_gp_consent=allow")).toBeNull();
    expect(readConsent("")).toBeNull();
  });
  it("builds a one-year cookie", () => {
    expect(consentCookie("allow")).toBe("gp_consent=allow; Max-Age=31536000; Path=/; SameSite=Lax; Secure");
  });
  it("expires only _hp2_ cookies, on the host and each parent domain", () => {
    const out = cookieExpiries("a=1; _hp2_id.123=x; _hp2_ses_props.123=y; gp_consent=allow", "www.gitprice.app", ["_hp2_"]);
    expect(out).toContain("_hp2_id.123=; Max-Age=0; Path=/");
    expect(out).toContain("_hp2_id.123=; Max-Age=0; Path=/; Domain=www.gitprice.app");
    expect(out).toContain("_hp2_id.123=; Max-Age=0; Path=/; Domain=gitprice.app");
    expect(out).toContain("_hp2_ses_props.123=; Max-Age=0; Path=/; Domain=gitprice.app");
    expect(out.some((c) => c.startsWith("a=") || c.startsWith("gp_consent"))).toBe(false);
    expect(out.some((c) => c.endsWith("Domain=app"))).toBe(false);
  });
  it("uses a host-only expiry on single-label hosts", () => {
    expect(cookieExpiries("_hp2_id.1=x", "localhost", ["_hp2_"])).toEqual(["_hp2_id.1=; Max-Age=0; Path=/"]);
  });
});

async function mount() {
  const { default: Analytics } = await import("../app/components/Analytics");
  const { default: CookieNotice, CookieSettingsButton } = await import("../app/components/CookieNotice");
  render(<><CookieNotice locale="en" /><CookieSettingsButton locale="en" /><Analytics /></>);
}
const heap = () => document.getElementById("heap");
const click = (name: string) => act(() => { fireEvent.click(screen.getByRole("button", { name })); });

describe("cookie notice and Heap", () => {
  it("loads Vercel Analytics but no Heap before consent, and shows the notice", async () => {
    await mount();
    expect(screen.getByTestId("vercel")).toBeTruthy();
    expect(heap()).toBeNull();
    expect(screen.getByRole("region", { name: N.title })).toBeTruthy();
  });

  it("Allow stores the cookie, injects Heap and hides the notice", async () => {
    await mount();
    click(N.button.allow.label);
    expect(document.cookie).toContain("gp_consent=allow");
    expect(heap()).not.toBeNull();
    expect(screen.queryByRole("region", { name: N.title })).toBeNull();
  });

  it("Decline stores the cookie, injects no Heap and hides the notice", async () => {
    await mount();
    click(N.button.decline.label);
    expect(document.cookie).toContain("gp_consent=decline");
    expect(heap()).toBeNull();
    expect(screen.queryByRole("region", { name: N.title })).toBeNull();
    expect(reload).not.toHaveBeenCalled();
  });

  it("stays hidden when a choice already exists, and reopens from the footer button", async () => {
    document.cookie = "gp_consent=decline";
    await mount();
    expect(screen.queryByRole("region", { name: N.title })).toBeNull();
    click(en.web.component.webFooter.default.label.cookies);
    expect(screen.getByRole("region", { name: N.title })).toBeTruthy();
  });

  it("Allow then Decline clears Heap _hp2_ and _hp5_ cookies and reloads", async () => {
    await mount();
    click(N.button.allow.label);
    document.cookie = "_hp2_id.123=abc; Path=/";
    document.cookie = "_hp5_meta.123=abc; Path=/";
    click(en.web.component.webFooter.default.label.cookies);
    click(N.button.decline.label);
    expect(document.cookie).toContain("gp_consent=decline");
    expect(document.cookie).not.toContain("_hp2_");
    expect(document.cookie).not.toContain("_hp5_");
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("Decline then Allow injects Heap without a reload", async () => {
    await mount();
    click(N.button.decline.label);
    click(en.web.component.webFooter.default.label.cookies);
    click(N.button.allow.label);
    expect(heap()).not.toBeNull();
    expect(reload).not.toHaveBeenCalled();
  });

  it("never loads Heap without a heapId, even after Allow", async () => {
    mockEnv.heapId = undefined;
    await mount();
    click(N.button.allow.label);
    expect(document.cookie).toContain("gp_consent=allow");
    expect(heap()).toBeNull();
  });

  it("never loads Heap outside production, even after Allow", async () => {
    vi.stubEnv("NODE_ENV", "development");
    await mount();
    click(N.button.allow.label);
    expect(heap()).toBeNull();
  });

  it("Allow twice loads Heap once", async () => {
    await mount();
    click(N.button.allow.label);
    click(en.web.component.webFooter.default.label.cookies);
    click(N.button.allow.label);
    expect(document.querySelectorAll("#heap")).toHaveLength(1);
    // A DOM count alone would hide a second mount that replaces the first.
    expect(scriptMounts.ids).toEqual(["heap"]);
  });

  it("moves focus to main after the first choice, and to the footer control after a reopen", async () => {
    const { default: CookieNotice, CookieSettingsButton } = await import("../app/components/CookieNotice");
    render(<><main tabIndex={-1} /><CookieNotice locale="en" /><CookieSettingsButton locale="en" /></>);
    screen.getByRole("button", { name: N.button.allow.label }).focus();
    click(N.button.allow.label);
    expect(document.activeElement).toBe(document.querySelector("main"));
    click(en.web.component.webFooter.default.label.cookies);
    click(N.button.decline.label);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: en.web.component.webFooter.default.label.cookies }));
  });
});

describe("setConsent and the dataLayer", () => {
  const dl = () => ((window as unknown as { dataLayer?: ArrayLike<unknown>[] }).dataLayer ?? []).map((a) => Array.from(a));
  beforeEach(() => { delete (window as { dataLayer?: unknown }).dataLayer; });
  it("allow pushes a granted consent update", async () => {
    const { setConsent } = await import("../lib/consent");
    setConsent("allow");
    expect(dl()).toContainEqual(["consent", "update", { analytics_storage: "granted" }]);
  });
  it("decline after allow pushes denied, expires _ga cookies, then reloads", async () => {
    const { setConsent } = await import("../lib/consent");
    setConsent("allow");
    document.cookie = "_ga=1; Path=/";
    let atReload: unknown[][] = [];
    reload.mockImplementation(() => { expect(document.cookie).not.toContain("_ga="); atReload = dl(); });
    setConsent("decline");
    expect(reload).toHaveBeenCalledTimes(1);
    expect(atReload).toContainEqual(["consent", "update", { analytics_storage: "denied" }]);
  });
  it("first-time decline expires existing _ga cookies without a reload", async () => {
    const { setConsent } = await import("../lib/consent");
    document.cookie = "_ga=1; Path=/";
    document.cookie = "_ga_SM4YKS90F0=2; Path=/";
    setConsent("decline");
    expect(document.cookie).not.toContain("_ga");
    expect(document.cookie).toContain("gp_consent=decline");
    expect(dl()).toContainEqual(["consent", "update", { analytics_storage: "denied" }]);
    expect(reload).not.toHaveBeenCalled();
  });
});

describe("cookie notice copy", () => {
  it.each(["en", "ar"] as const)("%s body renders the synced text and names no vendor", async (locale) => {
    const { default: CookieNotice } = await import("../app/components/CookieNotice");
    const { container } = render(<CookieNotice locale={locale} />);
    const body = (locale === "en" ? en : ar).web.component.webCookieNotice.default.body;
    expect(container.textContent).toContain(body);
    expect(container.textContent).not.toMatch(/Google|Heap/);
  });
});
