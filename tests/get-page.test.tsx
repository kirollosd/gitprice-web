import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../i18n/en.json";

const track = vi.hoisted(() => vi.fn());
vi.mock("../lib/track", () => ({ track }));

vi.mock("../lib/env", () => ({
  env: { chromeStoreUrl: "https://chromewebstore.test/gitprice", launch: true },
}));

const COPY = en.web.get;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  track.mockReset();
});

beforeEach(() => {
  document.documentElement.lang = "en";
  document.cookie = "gp_consent=; Max-Age=0; Path=/";
  window.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
});

async function mount(props: { phone?: boolean; utms?: Record<string, string> } = {}) {
  const { default: GetLanding } = await import("../app/components/GetLanding");
  const utms = props.utms ?? { utm_source: "ig", utm_medium: "paid", utm_campaign: "bf26" };
  const chromeHref = `https://chromewebstore.test/gitprice?utm_source=${utms.utm_source}&utm_medium=${utms.utm_medium}&utm_campaign=${utms.utm_campaign}`;
  return render(
    <GetLanding
      locale="en"
      phone={props.phone ?? false}
      chromeHref={chromeHref}
      utms={utms}
    />,
  );
}

describe("GetLanding", () => {
  it("desktop shows the CWS link with UTMs", async () => {
    await mount({ phone: false });
    const link = screen.getByRole("link", { name: COPY.cta.chrome });
    expect(link.getAttribute("href")).toContain("utm_source=ig");
    expect(link.getAttribute("href")).toContain("utm_medium=paid");
    expect(link.getAttribute("href")).toContain("utm_campaign=bf26");
    expect(link.getAttribute("data-gp-track")).toBe("store_click");
    expect(link.getAttribute("data-gp-store")).toBe("chrome");
    expect(screen.queryByRole("button", { name: COPY.form.submit })).toBeNull();
    expect(screen.getByRole("button", { name: COPY.form.emailInstead })).toBeTruthy();
  });

  it("phone shows the send-to-desktop form and posts to the API", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    document.cookie = "gp_consent=allow";
    await mount({ phone: true });
    expect(screen.queryByRole("link", { name: COPY.cta.chrome })).toBeNull();
    fireEvent.change(screen.getByLabelText(COPY.form.email.label), { target: { value: "sara@example.com" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: COPY.form.submit }));
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/send-to-desktop");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("same-origin");
    const body = JSON.parse(String(init.body)) as {
      email: string;
      website: string;
      utms: Record<string, string>;
      consent?: string;
    };
    expect(body.email).toBe("sara@example.com");
    expect(body.website).toBe("");
    expect(body.utms.utm_source).toBe("ig");
    expect(body.consent).toBeUndefined();
    expect(track).toHaveBeenCalledWith("send_to_desktop", { placement: "get" });
  });

  it("desktop secondary control reveals the form", async () => {
    await mount({ phone: false });
    fireEvent.click(screen.getByRole("button", { name: COPY.form.emailInstead }));
    expect(screen.getByRole("button", { name: COPY.form.submit })).toBeTruthy();
  });
});
