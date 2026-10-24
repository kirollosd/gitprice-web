import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// next/script is stubbed so tests can fire its callbacks; it also keeps the network out.
type ScriptProps = { src: string; strategy: string; onError?: () => void; onReady?: () => void };
let script: ScriptProps | undefined;
vi.mock("next/script", () => ({ default: (p: ScriptProps) => { script = p; return null; } }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

const w = window as unknown as { Tally?: { loadEmbeds: () => void } };

beforeEach(() => {
  script = undefined;
  delete w.Tally;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.doUnmock("../lib/env");
  vi.resetModules();
});

describe("TallyEmbed", () => {
  it("shows the fallback link when Tally fails to load", async () => {
    const { default: TallyEmbed } = await import("../app/components/TallyEmbed");
    render(<TallyEmbed formId="mYLGEG" locale="en" />);
    expect(screen.queryByRole("link")).toBeNull();
    act(() => script!.onError!());
    const link = screen.getByRole("link", { name: "Join the waitlist" });
    expect(link.getAttribute("href")).toBe("https://tally.so/r/mYLGEG");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener");
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("shows the fallback link when Tally is still undefined after 5 seconds", async () => {
    vi.useFakeTimers();
    const { default: TallyEmbed } = await import("../app/components/TallyEmbed");
    render(<TallyEmbed formId="mYLGEG" locale="en" />);
    act(() => { vi.advanceTimersByTime(4999); });
    expect(screen.queryByRole("link")).toBeNull();
    act(() => { vi.advanceTimersByTime(2); });
    expect(screen.getByRole("link").getAttribute("href")).toBe("https://tally.so/r/mYLGEG");
  });

  it("keeps the form when Tally is defined at 5 seconds", async () => {
    vi.useFakeTimers();
    const { default: TallyEmbed } = await import("../app/components/TallyEmbed");
    render(<TallyEmbed formId="mYLGEG" locale="en" />);
    w.Tally = { loadEmbeds: vi.fn() };
    act(() => { vi.advanceTimersByTime(6000); });
    expect(screen.queryByRole("link")).toBeNull();
    expect(document.querySelector("iframe")).not.toBeNull();
  });

  it("passes lang=ar to the embed and loads embed.js with the lazyOnload strategy", async () => {
    const { default: TallyEmbed } = await import("../app/components/TallyEmbed");
    render(<TallyEmbed formId="mYLGEG" locale="ar" />);
    expect(document.querySelector("iframe")!.getAttribute("data-tally-src")).toBe(
      "https://tally.so/embed/mYLGEG?transparentBackground=1&hideTitle=1&dynamicHeight=1&lang=ar",
    );
    expect(script).toMatchObject({ src: "https://tally.so/widgets/embed.js", strategy: "lazyOnload" });
  });

  it("brings the form back when Tally arrives after the 5 second fallback", async () => {
    vi.useFakeTimers();
    const { default: TallyEmbed } = await import("../app/components/TallyEmbed");
    render(<TallyEmbed formId="mYLGEG" locale="en" />);
    act(() => { vi.advanceTimersByTime(5001); });
    expect(screen.getByRole("link")).toBeTruthy();
    expect(document.querySelector("iframe")).toBeNull();
    let iframeMounted = false;
    const loadEmbeds = vi.fn(() => { iframeMounted = document.querySelector("iframe[data-tally-src]") !== null; });
    w.Tally = { loadEmbeds };
    act(() => script!.onReady!());
    expect(screen.queryByRole("link")).toBeNull();
    expect(document.querySelector("iframe")).not.toBeNull();
    expect(loadEmbeds).toHaveBeenCalledTimes(1);
    // Tally scans the DOM for the iframe, so it must already be mounted.
    expect(iframeMounted).toBe(true);
  });

  it("encodes the form id in both URLs", async () => {
    const { default: TallyEmbed } = await import("../app/components/TallyEmbed");
    render(<TallyEmbed formId="a b&c" locale="en" />);
    expect(document.querySelector("iframe")!.getAttribute("data-tally-src")).toContain("/embed/a%20b%26c?");
    act(() => script!.onError!());
    expect(screen.getByRole("link").getAttribute("href")).toBe("https://tally.so/r/a%20b%26c");
  });

  it("calls Tally.loadEmbeds once the script is ready", async () => {
    const { default: TallyEmbed } = await import("../app/components/TallyEmbed");
    render(<TallyEmbed formId="mYLGEG" locale="en" />);
    const loadEmbeds = vi.fn();
    w.Tally = { loadEmbeds };
    act(() => script!.onReady!());
    expect(loadEmbeds).toHaveBeenCalledTimes(1);
  });
});

describe("launch switch", () => {
  const mockEnv = (launch: boolean) =>
    vi.doMock("../lib/env", () => ({
      env: {
        launch,
        chromeStoreUrl: "https://chromewebstore.test/gitprice",
        appStoreUrl: "https://apps.test/gitprice",
        playStoreUrl: "https://play.test/gitprice",
        tallyFormId: "mYLGEG",
      },
    }));

  it("launch=1 renders Add to Chrome with chromeStoreUrl and no Tally iframe", async () => {
    mockEnv(true);
    const { default: HomeContent } = await import("../app/components/HomeSections");
    render(<HomeContent locale="en" />);
    const chrome = screen.getAllByRole("link", { name: "Add GitPrice to Chrome" });
    expect(chrome.length).toBeGreaterThan(0);
    chrome.forEach((a) => expect(a.getAttribute("href")).toBe("https://chromewebstore.test/gitprice"));
    expect(document.querySelector("iframe")).toBeNull();
    expect(script).toBeUndefined();
  });

  it("launch=0 renders the waitlist form and no store links", async () => {
    mockEnv(false);
    const { default: HomeContent } = await import("../app/components/HomeSections");
    render(<HomeContent locale="en" />);
    expect(document.querySelectorAll("iframe[data-tally-src]").length).toBe(2);
    expect(screen.queryByRole("link", { name: "Add GitPrice to Chrome" })).toBeNull();
  });

  it("store badges link to both app stores and use localized labels", async () => {
    mockEnv(true);
    const { default: StoreBadges } = await import("../app/components/StoreBadges");
    render(<StoreBadges locale="en" />);
    expect(screen.getByRole("link", { name: /App Store/ }).getAttribute("href")).toBe("https://apps.test/gitprice");
    expect(screen.getByRole("link", { name: /Google Play/ }).getAttribute("href")).toBe("https://play.test/gitprice");
  });
});
