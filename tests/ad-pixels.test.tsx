import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../i18n/en.json";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));
vi.mock("@vercel/analytics/react", () => ({ Analytics: () => <i data-testid="vercel" /> }));
vi.mock("@vercel/speed-insights/next", () => ({ SpeedInsights: () => null }));

const scriptMounts = vi.hoisted(() => ({ ids: [] as string[] }));
vi.mock("next/script", async () => {
  const { useEffect } = await import("react");
  function Script({ id }: { id: string }) {
    useEffect(() => {
      scriptMounts.ids.push(id);
    }, [id]);
    return <script id={id} />;
  }
  return { default: Script };
});

const mockEnv = vi.hoisted(() => ({
  heapId: undefined as string | undefined,
  metaPixelId: "meta123" as string | undefined,
  tiktokPixelId: "tt456" as string | undefined,
}));
vi.mock("../lib/env", () => ({ env: mockEnv }));

const N = en.web.component.webCookieNotice.default;
const clearCookies = () =>
  document.cookie.split(";").forEach((c) => {
    document.cookie = `${c.split("=")[0].trim()}=; Max-Age=0; Path=/`;
  });

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string };
type Ttq = { track: (...args: unknown[]) => void; page: (...args: unknown[]) => void; load: (...args: unknown[]) => void; methods?: string[]; _i?: Record<string, unknown>; _t?: Record<string, unknown>; _o?: Record<string, unknown> };

beforeEach(() => {
  clearCookies();
  scriptMounts.ids.length = 0;
  mockEnv.metaPixelId = "meta123";
  mockEnv.tiktokPixelId = "tt456";
  mockEnv.heapId = undefined;
  vi.stubEnv("NODE_ENV", "production");
  delete (window as { fbq?: Fbq }).fbq;
  delete (window as { ttq?: Ttq }).ttq;
  delete (window as { _fbq?: Fbq })._fbq;
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

async function mountAnalytics() {
  const { default: Analytics } = await import("../app/components/Analytics");
  const { default: CookieNotice } = await import("../app/components/CookieNotice");
  render(
    <>
      <CookieNotice locale="en" />
      <Analytics />
    </>,
  );
}

describe("ad pixels", () => {
  it("loads no Meta or TikTok scripts when consent is null or decline", async () => {
    await mountAnalytics();
    expect(document.getElementById("meta-pixel")).toBeNull();
    expect(document.getElementById("tiktok-pixel")).toBeNull();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: N.button.decline.label }));
    });
    expect(document.getElementById("meta-pixel")).toBeNull();
    expect(document.getElementById("tiktok-pixel")).toBeNull();
  });

  it("loads Meta and TikTok scripts once on Allow", async () => {
    await mountAnalytics();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: N.button.allow.label }));
    });
    expect(document.getElementById("meta-pixel")).not.toBeNull();
    expect(document.getElementById("tiktok-pixel")).not.toBeNull();
    expect(scriptMounts.ids).toEqual(expect.arrayContaining(["meta-pixel", "tiktok-pixel"]));
  });

  it("meta and tiktok snippets include a single PageView / page call", async () => {
    const { metaPixelSnippet, tiktokPixelSnippet } = await import("../lib/ad-pixels");
    const meta = metaPixelSnippet("meta123");
    expect(meta.match(/fbq\('track','PageView'\)/g)).toHaveLength(1);
    expect(meta).toContain("meta123");
    const tt = tiktokPixelSnippet("tt456");
    expect(tt.match(/ttq\.page\(\)/g)).toHaveLength(1);
    expect(tt).toContain("tt456");
  });

  it("no-ops when pixel ids are missing even after Allow", async () => {
    mockEnv.metaPixelId = undefined;
    mockEnv.tiktokPixelId = undefined;
    await mountAnalytics();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: N.button.allow.label }));
    });
    expect(document.getElementById("meta-pixel")).toBeNull();
    expect(document.getElementById("tiktok-pixel")).toBeNull();
  });

  it("pushAdEvent sends cws_click and send_to_desktop to Meta and TikTok when present", async () => {
    const calls: unknown[][] = [];
    const fbq = ((...args: unknown[]) => {
      calls.push(args);
    }) as Fbq;
    (window as { fbq?: Fbq }).fbq = fbq;
    const ttTrack = vi.fn();
    (window as { ttq?: Ttq }).ttq = { track: ttTrack, page: vi.fn(), load: vi.fn() };

    const { pushAdEvent } = await import("../lib/ad-pixels");
    pushAdEvent("cws_click");
    pushAdEvent("send_to_desktop");
    expect(calls).toContainEqual(["trackCustom", "cws_click"]);
    expect(calls).toContainEqual(["trackCustom", "send_to_desktop"]);
    expect(ttTrack).toHaveBeenCalledWith("cws_click");
    expect(ttTrack).toHaveBeenCalledWith("send_to_desktop");
  });

  it("pushAdEvent is a no-op when pixels are absent", async () => {
    const { pushAdEvent } = await import("../lib/ad-pixels");
    expect(() => pushAdEvent("PageView")).not.toThrow();
  });
});
