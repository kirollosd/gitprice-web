import { Resend } from "resend";
import { readConsent } from "../../../lib/consent";
import { isValidEmail } from "../../../lib/email";
import { env } from "../../../lib/env";
import { sendMetaCapiEvent } from "../../../lib/meta-capi";
import { hitIpLimit, isEmailCoolingDown, markEmailSent } from "../../../lib/send-rate";
import { verifyTurnstile } from "../../../lib/turnstile";
import { chromeStoreUrlWithUtms, type UtmParams } from "../../../lib/utm";

export const runtime = "nodejs";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const EMAIL_COOLDOWN_MS = 15 * 60_000;
const MAX_UTM_KEYS = 15;
const MAX_UTM_VALUE = 200;

type Body = {
  email?: unknown;
  website?: unknown;
  locale?: unknown;
  utms?: unknown;
  turnstileToken?: unknown;
};

function clientIp(req: Request): string {
  // Prefer platform headers; do not trust the first X-Forwarded-For hop alone.
  const vercel = req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  const real = req.headers.get("x-real-ip")?.trim();
  return vercel || real || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** Same-site browser posts only (fetch always sends Origin). */
function sameSiteRequest(req: Request): boolean {
  const expected = new URL(req.url).origin;
  const origin = req.headers.get("origin");
  if (origin) return origin === expected;
  const referer = req.headers.get("referer");
  if (!referer) return false;
  try {
    return new URL(referer).origin === expected;
  } catch {
    return false;
  }
}

function asUtms(raw: unknown): UtmParams | null {
  if (!raw || typeof raw !== "object") return {};
  const out: UtmParams = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!k.startsWith("utm_") || typeof v !== "string" || !v) continue;
    if (v.length > MAX_UTM_VALUE) return null;
    if (Object.keys(out).length >= MAX_UTM_KEYS) continue; // keep first N; do not 400
    out[k] = v;
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

function storeHostnameAllowed(link: string, base: string): boolean {
  try {
    return new URL(link).hostname === new URL(base).hostname;
  } catch {
    return false;
  }
}

/** POST /api/send-to-desktop — emails the Chrome Web Store link (with UTMs). Never logs the address. */
export async function POST(req: Request): Promise<Response> {
  if (!sameSiteRequest(req)) return Response.json({ error: "forbidden" }, { status: 403 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const honeypot = typeof body.website === "string" ? body.website : "";
  if (honeypot.trim()) return new Response(null, { status: 204 });

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isValidEmail(email)) return Response.json({ error: "invalid" }, { status: 400 });

  const ip = clientIp(req);

  // When TURNSTILE_SECRET_KEY is set (production), require a valid widget token.
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (turnstileSecret) {
    const token = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
    const ok = await verifyTurnstile({
      token,
      secret: turnstileSecret,
      remoteip: ip === "unknown" ? undefined : ip,
    });
    if (!ok) return Response.json({ error: "captcha" }, { status: 403 });
  }

  if (await hitIpLimit(ip, MAX_PER_WINDOW, WINDOW_MS)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }
  if (await isEmailCoolingDown(email)) return Response.json({ error: "rate_limited" }, { status: 429 });

  const utms = asUtms(body.utms);
  if (utms === null) return Response.json({ error: "invalid" }, { status: 400 });

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  if (!apiKey || !from) return Response.json({ error: "unavailable" }, { status: 503 });

  const locale = body.locale === "ar" ? "ar" : "en";
  const storeBase = env.chromeStoreUrl || "https://chromewebstore.google.com/";
  const link = chromeStoreUrlWithUtms(storeBase, utms);
  if (!storeHostnameAllowed(link, storeBase)) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
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

  await markEmailSent(email, EMAIL_COOLDOWN_MS);

  // CAPI only when the gp_consent cookie is Allow (never trust a client body flag).
  // Bounded + non-blocking so a slow Graph call cannot turn a sent email into a client "failed".
  if (readConsent(req.headers.get("cookie") ?? "") === "allow") {
    void sendMetaCapiEvent({
      event: "send_to_desktop",
      email,
      eventSourceUrl: env.siteUrl ? `${env.siteUrl.replace(/\/+$/, "")}/${locale === "ar" ? "ar/" : ""}get` : undefined,
      clientIp: ip === "unknown" ? undefined : ip,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });
  }

  return Response.json({ ok: true }, { status: 200 });
}
