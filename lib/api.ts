import { env } from "./env";
import type { Locale } from "./i18n";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; code: string };

type Envelope<T> = { success: boolean; data: T | null; error: { code: string; message: string } | null };

export type HandoffSummary = {
  plan: "pro_monthly" | "pro_annual";
  priceMinor: number;
  currency: string;
  period: "month" | "year";
};
export type ReturnStatus = { status: "pending" | "active" | "failed" };

async function call<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${env.apiBaseUrl}/api/v1${path}`, {
      ...init,
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
    let body: Envelope<T>;
    try {
      body = (await res.json()) as Envelope<T>;
    } catch {
      // Not JSON (a proxy page, plain text): keep the HTTP status so a 404/410 still maps.
      return { ok: false, status: res.status, code: "NETWORK" };
    }
    if (res.ok && body.success && body.data !== null) return { ok: true, data: body.data };
    return { ok: false, status: res.status, code: body.error?.code ?? "UNKNOWN" };
  } catch {
    // A throw, an abort or a timeout.
    return { ok: false, status: 0, code: "NETWORK" };
  }
}

const handoff = (code: string) => `/subscription/checkout/handoff/${encodeURIComponent(code)}`;

export const getHandoffSummary = (code: string) => call<HandoffSummary>(`${handoff(code)}/summary`);

export const redeemHandoff = (code: string, locale: Locale) =>
  call<{ redirectUrl: string }>(`${handoff(code)}/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locale }),
  });

export const getReturnStatus = (token: string, signal?: AbortSignal) =>
  call<ReturnStatus>(`/subscription/checkout/return/${encodeURIComponent(token)}`, { signal });
