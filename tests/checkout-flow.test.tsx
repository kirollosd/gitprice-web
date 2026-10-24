import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../i18n/en.json";

const api = vi.hoisted(() => ({
  getHandoffSummary: vi.fn(),
  redeemHandoff: vi.fn(),
}));
vi.mock("../lib/api", () => api);

const C = en.web.checkout;
const assign = vi.fn();

beforeEach(() => {
  api.getHandoffSummary.mockResolvedValue({ ok: true, data: { plan: "pro_monthly", priceMinor: 9900, currency: "EGP", period: "month" } });
  api.redeemHandoff.mockResolvedValue({ ok: true, data: { redirectUrl: "https://pay.example.test/s" } });
  vi.stubGlobal("location", { ...window.location, assign, search: "?utm=x", pathname: "/checkout", hash: "#code=c" });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

async function mount() {
  const { default: CheckoutFlow } = await import("../app/components/CheckoutFlow");
  render(<CheckoutFlow locale="en" />);
}

describe("CheckoutFlow", () => {
  it("keeps an unrelated query param when stripping the fragment", async () => {
    const replace = vi.spyOn(window.history, "replaceState");
    await mount();
    await screen.findByRole("heading", { name: C.summary.title });
    expect(replace).toHaveBeenCalledWith(null, "", "/checkout?utm=x");
  });

  it("falls back to signed out when restored from bfcache while redirecting", async () => {
    await mount();
    const btn = await screen.findByRole("button", { name: C.summary.button.label });
    await act(async () => { btn.click(); });
    await screen.findByRole("heading", { name: C.redirecting.title });
    act(() => { window.dispatchEvent(Object.assign(new Event("pageshow"), { persisted: false })); });
    expect(screen.getByRole("heading", { name: C.redirecting.title })).toBeTruthy();
    act(() => { window.dispatchEvent(Object.assign(new Event("pageshow"), { persisted: true })); });
    await waitFor(() => expect(screen.getByRole("heading", { name: C.signedOut.title })).toBeTruthy());
  });

  it("moves focus to the new heading when the view changes, not on first load", async () => {
    await mount();
    expect(document.activeElement).toBe(document.body);
    const btn = await screen.findByRole("button", { name: C.summary.button.label });
    expect(document.activeElement).toBe(document.body); // leaving the load view never moves focus
    btn.focus();
    await act(async () => { btn.click(); });
    const h1 = await screen.findByRole("heading", { name: C.redirecting.title });
    expect(document.activeElement).toBe(h1);
  });
});
