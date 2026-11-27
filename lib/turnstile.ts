type VerifyOpts = {
  token: string;
  secret: string;
  remoteip?: string;
  fetchImpl?: typeof fetch;
};

/**
 * Cloudflare Turnstile siteverify. Never throws.
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
export async function verifyTurnstile(opts: VerifyOpts): Promise<boolean> {
  const token = opts.token.trim();
  const secret = opts.secret.trim();
  if (!token || !secret) return false;

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (opts.remoteip) body.set("remoteip", opts.remoteip);

  const fetchFn = opts.fetchImpl ?? fetch;
  try {
    const res = await fetchFn("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(3_000),
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { success?: unknown };
    return json.success === true;
  } catch {
    return false;
  }
}
