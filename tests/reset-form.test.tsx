import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../i18n/en.json";

const calls: { verifyOtp: unknown[]; setSession: unknown[] } = { verifyOtp: [], setSession: [] };
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      verifyOtp: (a: unknown) => (calls.verifyOtp.push(a), Promise.resolve({ data: { session: null }, error: { code: "otp_expired" } })),
      setSession: (a: unknown) => (calls.setSession.push(a), Promise.resolve({ data: { session: null }, error: { code: "otp_expired" } })),
    },
  }),
}));

beforeEach(() => {
  calls.verifyOtp = [];
  calls.setSession = [];
  delete window.__gpTake;
});
afterEach(cleanup);

async function mount() {
  const { default: Form } = await import("../app/components/ResetPasswordForm");
  return render(<Form locale="en" />);
}
const R = en.web.resetPassword;

describe("ResetPasswordForm", () => {
  it("does not verify on load (link scanners): it waits for a click", async () => {
    window.history.replaceState(null, "", "/reset-password?token_hash=h&type=recovery");
    await mount();
    await screen.findByRole("button", { name: en.web.auth.confirm.button.label });
    expect(calls.verifyOtp).toEqual([]);
    expect(window.location.search).toBe("");
  });

  it("verifies on click and keeps the same status element from verifying to expired", async () => {
    window.history.replaceState(null, "", "/reset-password?token_hash=h&type=recovery");
    await mount();
    fireEvent.click(await screen.findByRole("button"));
    const region = await screen.findByRole("status");
    await screen.findByText(R.linkExpired.title);
    expect(screen.getByRole("status")).toBe(region);
    expect(region.textContent).toContain(R.linkExpired.body);
    expect(calls.verifyOtp).toEqual([{ type: "recovery", token_hash: "h" }]);
  });

  it("reads a legacy implicit link from the one-shot reader, after a click", async () => {
    window.history.replaceState(null, "", "/reset-password");
    window.__gpTake = () => ({ search: "", hash: "#access_token=a&refresh_token=r&type=recovery" });
    await mount();
    expect(calls.setSession).toEqual([]);
    fireEvent.click(await screen.findByRole("button"));
    await screen.findByText(R.linkExpired.title);
    expect(calls.setSession).toEqual([{ access_token: "a", refresh_token: "r" }]);
  });

  it("verifies at once when the confirm page already had the click (in-memory handoff)", async () => {
    window.history.replaceState(null, "", "/reset-password");
    const { handoff } = await import("../lib/authHandoff");
    handoff({ search: "?token_hash=held&type=recovery", hash: "", clicked: true });
    await mount();
    await screen.findByText(R.linkExpired.title);
    expect(calls.verifyOtp).toEqual([{ type: "recovery", token_hash: "held" }]);
  });

  it("shows link-expired without a button when there is no token", async () => {
    window.history.replaceState(null, "", "/reset-password");
    await mount();
    await screen.findByText(R.linkExpired.title);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
