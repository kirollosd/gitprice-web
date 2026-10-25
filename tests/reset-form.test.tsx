import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "../i18n/en.json";

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { verifyOtp: async () => ({ data: { session: null }, error: { code: "otp_expired" } }) } }),
}));

afterEach(cleanup);

describe("ResetPasswordForm live region", () => {
  it("keeps the same status element from verifying to expired and swaps its text", async () => {
    window.history.replaceState(null, "", "/reset-password?token_hash=h&type=recovery");
    const { default: Form } = await import("../app/components/ResetPasswordForm");
    render(<Form locale="en" />);
    const region = screen.getByRole("status");
    expect(region.textContent).toContain(en.web.resetPassword.verifying.title);
    await screen.findByText(en.web.resetPassword.linkExpired.title);
    expect(screen.getByRole("status")).toBe(region);
    expect(region.textContent).toContain(en.web.resetPassword.linkExpired.title);
    expect(region.textContent).toContain(en.web.resetPassword.linkExpired.body);
  });
});
