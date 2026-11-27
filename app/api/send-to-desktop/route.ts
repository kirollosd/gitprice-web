import { Resend } from "resend";
import { isValidEmail } from "../../../lib/email";
import { env } from "../../../lib/env";
import { sendMetaCapiEvent } from "../../../lib/meta-capi";
import { chromeStoreUrlWithUtms, type UtmParams } from "../../../lib/utm";

export const runtime = "nodejs";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const buckets = new Map<string, { count: number; resetAt: number }>();

type Body = {
  email?: unknown;
  website?: unknown;
  locale?: unknown;
  utms?: unknown;
  consent?: unknown;
};

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip")?.trim() || "unknown";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hit = buckets.get(ip);
  if (!hit || hit.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (hit.count >= MAX_PER_WINDOW) return true;
  hit.count += 1;
  return false;
}

function asUtms(raw: unknown): UtmParams {
  if (!raw || typeof raw !== "object") return {};
  const out: UtmParams = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (k.startsWith("utm_") && typeof v === "string" && v) out[k] = v;
  }
  return out;
}

function emailHtml(link: string, locale: string): string {
  const lead =
    locale === "ar"
      ? "افتح هذا الرابط على جهاز الكمبيوتر لإضافة GitPrice إلى Chrome."
      : "Open this link on your computer to add GitPrice to Chrome.";
  const label = locale === "ar" ? "إضافة إلى Chrome" : "Add to Chrome";
  return `<p>${lead}</p><p><a href="${link}">${label}</a></p><p style="word-break:break-all;font-size:12px;color:#52525b">${link}</p>`;
}

/** POST /api/send-to-desktop — emails the Chrome Web Store link (with UTMs). Never logs the address. */
export async function POST(req: Request): Promise<Response> {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const honeypot = typeof body.website === "string" ? body.website : "";
  if (honeypot.trim()) return new Response(null, { status: 204 });

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!isValidEmail(email)) return Response.json({ error: "invalid" }, { status: 400 });

  const ip = clientIp(req);
  if (rateLimited(ip)) return Response.json({ error: "rate_limited" }, { status: 429 });

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  if (!apiKey || !from) return Response.json({ error: "unavailable" }, { status: 503 });

  const locale = body.locale === "ar" ? "ar" : "en";
  const storeBase = env.chromeStoreUrl || "https://chromewebstore.google.com/";
  const link = chromeStoreUrlWithUtms(storeBase, asUtms(body.utms));
  const subject = locale === "ar" ? "رابط GitPrice لـ Chrome" : "Your GitPrice Chrome link";

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: email,
      subject,
      html: emailHtml(link, locale),
    });
    if (error) return Response.json({ error: "failed" }, { status: 502 });
  } catch {
    return Response.json({ error: "failed" }, { status: 502 });
  }

  // Conservative: CAPI only when the client already recorded consent Allow (hashed email only).
  if (body.consent === "allow") {
    await sendMetaCapiEvent({
      event: "send_to_desktop",
      email,
      eventSourceUrl: env.siteUrl ? `${env.siteUrl.replace(/\/+$/, "")}/${locale === "ar" ? "ar/" : ""}get` : undefined,
      clientIp: ip === "unknown" ? undefined : ip,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });
  }

  return Response.json({ ok: true }, { status: 200 });
}
