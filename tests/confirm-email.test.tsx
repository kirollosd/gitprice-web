import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

const verifyOtp = vi.fn();
let offline = false;
vi.mock("@supabase/supabase-js", () => ({
  // This vitest build fails a test whose mock throws or rejects, even when the code under test catches it, so the failure is injected here.
  createClient: () => ({ auth: { verifyOtp: (...a: unknown[]) => (offline ? Promise.reject(new TypeError("Failed to fetch")) : verifyOtp(...a)) } }),
}));
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

beforeEach(() => {
  verifyOtp.mockReset();
  push.mockReset();
  offline = false;
  delete window.__gpTake;
});
afterEach(cleanup);

async function mount(url: string, locale: "en" | "ar" = "en") {
  window.history.replaceState(null, "", url);
  const { default: ConfirmEmail } = await import("../app/components/ConfirmEmail");
  return render(<ConfirmEmail locale={locale} />);
}
const click = () => fireEvent.click(screen.getByRole("button"));
const A = en.web.auth;

describe("ConfirmEmail", () => {
  it("does not call Supabase until the user clicks, and removes a token still in the URL", async () => {
    window.history.replaceState({ router: 1 }, "", "/auth/confirm?token_hash=abc&type=signup");
    await mount("/auth/confirm?token_hash=abc&type=signup");
    expect(verifyOtp).not.toHaveBeenCalled();
    expect(window.location.search).toBe("");
    expect(screen.getByRole("button", { name: A.confirm.button.label })).toBeTruthy();
  });

  it("reads the token the head script stripped (one-shot reader) and verifies it on click", async () => {
    window.__gpTake = () => ({ search: "?lang=ar&token_hash=zzz&type=signup", hash: "" });
    verifyOtp.mockResolvedValue({ data: {}, error: null });
    await mount("/auth/confirm");
    click();
    await screen.findByText(A.confirmed.title);
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "zzz", type: "signup" });
  });

  it("verifies the in-memory token_hash and type, then shows the confirmed state", async () => {
    verifyOtp.mockResolvedValue({ data: {}, error: null });
    await mount("/auth/confirm?token_hash=abc&type=email_change");
    click();
    await screen.findByText(A.confirmed.title);
    expect(verifyOtp).toHaveBeenCalledOnce();
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "abc", type: "email_change" });
    expect(screen.getByText(A.confirmed.body)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it.each([403, 422, 400])("a %i answer is terminal: recovery message, no button", async (status) => {
    verifyOtp.mockResolvedValue({ data: {}, error: { code: "otp_expired", status } });
    await mount("/auth/confirm?token_hash=abc&type=signup");
    click();
    await screen.findByText(A.confirm.failed.title);
    expect(screen.getByText(A.confirm.failed.body)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    expect(verifyOtp).toHaveBeenCalledOnce();
  });

  it("a 5xx answer restores the token and the button, with a retry note, and the retry works", async () => {
    verifyOtp.mockResolvedValueOnce({ data: {}, error: { status: 503 } }).mockResolvedValueOnce({ data: {}, error: null });
    await mount("/auth/confirm?token_hash=abc&type=signup");
    click();
    await screen.findByText(A.confirm.retry.body);
    const again = screen.getByRole("button", { name: A.confirm.button.label }) as HTMLButtonElement;
    expect(again.disabled).toBe(false);
    fireEvent.click(again);
    await screen.findByText(A.confirmed.title);
    expect(verifyOtp).toHaveBeenNthCalledWith(2, { token_hash: "abc", type: "signup" });
  });

  it("a thrown network error also allows a retry", async () => {
    offline = true;
    await mount("/auth/confirm?token_hash=abc&type=signup");
    click();
    await screen.findByText(A.confirm.retry.body);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByText(A.confirm.failed.title)).toBeNull();
  });

  it.each(["/auth/confirm", "/auth/confirm?token_hash=abc", "/auth/confirm?token_hash=abc&type=magiclink", "/auth/confirm?type=signup"])(
    "shows the failure state without a button for %s",
    async (url) => {
      await mount(url);
      expect(screen.getByText(A.confirm.failed.title)).toBeTruthy();
      expect(screen.queryByRole("button")).toBeNull();
      expect(verifyOtp).not.toHaveBeenCalled();
    },
  );

  it("recovery: disables the button, navigates client-side with no token in the URL, and does not verify", async () => {
    await mount("/auth/confirm?token_hash=abc&type=recovery", "ar");
    click();
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
    expect(verifyOtp).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/ar/reset-password");
    const { takeAuth } = await import("../lib/authHandoff");
    expect(takeAuth()).toEqual({ search: "?token_hash=abc&type=recovery", hash: "", clicked: true });
    expect(takeAuth()).toBeNull();
  });

  it("puts the live region on the body text, not the heading", async () => {
    await mount("/auth/confirm?token_hash=abc&type=signup");
    const status = screen.getByRole("status");
    expect(status.tagName).toBe("P");
    expect(screen.getByRole("heading").closest("[role=status]")).toBeNull();
  });

  it("renders Arabic copy", async () => {
    await mount("/ar/auth/confirm?token_hash=abc&type=signup", "ar");
    expect(screen.getByRole("button", { name: ar.web.auth.confirm.button.label })).toBeTruthy();
    expect(screen.getByRole("heading").textContent).toBe(ar.web.auth.confirm.title);
  });
});
