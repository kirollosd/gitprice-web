import { createHash } from "node:crypto";

export type CapIEvent = "send_to_desktop" | "cws_click";

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

/**
 * Server-side Meta Conversions API. Fires only when the caller already verified consent Allow.
 * No-ops when pixel id or access token are missing. Never throws; never logs the email.
 */
export async function sendMetaCapiEvent(opts: {
  event: CapIEvent;
  email?: string;
  eventSourceUrl?: string;
  clientIp?: string;
  userAgent?: string;
  fetchImpl?: typeof fetch;
}): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const token = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  if (!pixelId || !token) return;

  const user_data: Record<string, string> = {};
  if (opts.email) user_data.em = sha256(opts.email);
  if (opts.clientIp) user_data.client_ip_address = opts.clientIp;
  if (opts.userAgent) user_data.client_user_agent = opts.userAgent;

  const body = {
    data: [
      {
        event_name: opts.event,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_source_url: opts.eventSourceUrl,
        user_data,
      },
    ],
  };

  const fetchFn = opts.fetchImpl ?? fetch;
  try {
    await fetchFn(`https://graph.facebook.com/v21.0/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    /* CAPI must never fail the user-facing request */
  }
}
