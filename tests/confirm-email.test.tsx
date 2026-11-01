import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

const verifyOtp = vi.fn();
let offline = false;
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { verifyOtp: (...a: unknown[]) => (offline ? Promise.reject(new TypeError("Failed to fetch")) : verifyOtp(...a)) } }),
}));

beforeEach(() => {
  verifyOtp.mockReset();
  offline = false;
});
afterEach(cleanup);

async function mount(url: string, locale: "en" | "ar" = "en") {
  window.history.replaceState(null, "", url);
  const { default: ConfirmEmail } = await import("../app/components/ConfirmEmail");
  return render(<ConfirmEmail locale={locale} />);
}

describe("ConfirmEmail", () => {
  it("does not call Supabase until the user clicks, and removes the token from the URL", async () => {
    await mount("/auth/confirm?token_hash=abc&type=signup");
    expect(verifyOtp).not.toHaveBeenCalled();
    expect(window.location.search).toBe("");
    expect(window.location.pathname).toBe("/auth/confirm");
    expect(screen.getByRole("button", { name: en.web.auth.confirm.button.label })).toBeTruthy();
  });

  it("verifies with the in-memory token_hash and type on click, then shows the confirmed state", async () => {
    verifyOtp.mockResolvedValue({ data: {}, error: null });
    await mount("/auth/confirm?token_hash=abc&type=email_change");
    fireEvent.click(screen.getByRole("button"));
    await screen.findByText(en.web.auth.confirmed.title);
    expect(verifyOtp).toHaveBeenCalledOnce();
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "abc", type: "email_change" });
    expect(screen.getByText(en.web.auth.confirmed.body)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows the recovery path when Supabase rejects the token, and does not retry on its own", async () => {
    verifyOtp.mockResolvedValue({ data: {}, error: { code: "otp_expired" } });
    await mount("/auth/confirm?token_hash=abc&type=signup");
    fireEvent.click(screen.getByRole("button"));
    await screen.findByText(en.web.auth.confirm.failed.title);
    expect(screen.getByText(en.web.auth.confirm.failed.body)).toBeTruthy();
    expect(verifyOtp).toHaveBeenCalledOnce();
  });

  it("treats a thrown network error as a failure", async () => {
    offline = true;
    await mount("/auth/confirm?token_hash=abc&type=signup");
    fireEvent.click(screen.getByRole("button"));
    await screen.findByText(en.web.auth.confirm.failed.title);
  });

  it.each(["/auth/confirm", "/auth/confirm?token_hash=abc", "/auth/confirm?token_hash=abc&type=magiclink", "/auth/confirm?type=signup"])(
    "shows the failure state without a button for %s",
    async (url) => {
      await mount(url);
      expect(screen.getByText(en.web.auth.confirm.failed.title)).toBeTruthy();
      expect(screen.queryByRole("button")).toBeNull();
      expect(verifyOtp).not.toHaveBeenCalled();
    },
  );

  it("sends recovery links to the reset form instead of consuming the token here", async () => {
    const assign = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({ ...window.location, search: "?token_hash=abc&type=recovery", pathname: "/auth/confirm", assign } as unknown as Location);
    const replace = vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
    const { default: ConfirmEmail } = await import("../app/components/ConfirmEmail");
    render(<ConfirmEmail locale="ar" />);
    fireEvent.click(screen.getByRole("button"));
    expect(verifyOtp).not.toHaveBeenCalled();
    expect(assign).toHaveBeenCalledWith("/ar/reset-password?token_hash=abc&type=recovery");
    replace.mockRestore();
    vi.restoreAllMocks();
  });

  it("renders Arabic copy", async () => {
    await mount("/ar/auth/confirm?token_hash=abc&type=signup", "ar");
    expect(screen.getByRole("button", { name: ar.web.auth.confirm.button.label })).toBeTruthy();
    await waitFor(() => expect(screen.getByRole("heading").textContent).toBe(ar.web.auth.confirm.title));
  });
});
