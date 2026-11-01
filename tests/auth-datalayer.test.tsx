import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { verifyOtp: () => Promise.resolve({ data: { session: null }, error: { status: 403 } }) } }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }));

afterEach(cleanup);

const SECRET = "SECRET-TOKEN-VALUE";
const seen = () => JSON.stringify((window as unknown as { dataLayer?: unknown[] }).dataLayer ?? []);

describe("analytics never sees an auth token", () => {
  it("confirm page: nothing on dataLayer or in location.href carries the token, before or after the click", async () => {
    (window as unknown as { dataLayer: unknown[] }).dataLayer = [];
    window.history.replaceState(null, "", `/auth/confirm?token_hash=${SECRET}&type=signup`);
    const { default: ConfirmEmail } = await import("../app/components/ConfirmEmail");
    render(<ConfirmEmail locale="en" />);
    expect(window.location.href).not.toContain(SECRET);
    fireEvent.click(screen.getByRole("button"));
    await screen.findByRole("heading");
    expect(seen()).not.toContain(SECRET);
    expect(window.location.href).not.toContain(SECRET);
  });

  it("reset page: same", async () => {
    (window as unknown as { dataLayer: unknown[] }).dataLayer = [];
    window.history.replaceState(null, "", `/reset-password?token_hash=${SECRET}&type=recovery`);
    const { default: Form } = await import("../app/components/ResetPasswordForm");
    render(<Form locale="en" />);
    fireEvent.click(await screen.findByRole("button"));
    await screen.findByRole("status");
    expect(seen()).not.toContain(SECRET);
    expect(window.location.href).not.toContain(SECRET);
  });
});
