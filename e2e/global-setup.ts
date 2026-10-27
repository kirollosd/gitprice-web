import { request, type FullConfig } from "@playwright/test";
import { mkdirSync } from "node:fs";

/**
 * Vercel Deployment Protection: one request to the deployment origin trades the bypass secret for a `_vercel_jwt` cookie.
 * The cookie belongs to that origin only, so the secret never goes to third parties (unlike a global extraHTTPHeaders).
 */
export const BYPASS_STATE = "e2e/.auth/bypass.json";

export default async function globalSetup(config: FullConfig) {
  const secret = process.env.VERCEL_BYPASS_SECRET;
  const base = process.env.PLAYWRIGHT_BASE_URL;
  if (!secret || !base) return;
  const ctx = await request.newContext({ baseURL: base, extraHTTPHeaders: { "x-vercel-protection-bypass": secret, "x-vercel-set-bypass-cookie": "true" } });
  const res = await ctx.get("/");
  if (res.status() === 401 || res.status() === 403) throw new Error(`Deployment Protection bypass was refused (${res.status()}); check VERCEL_AUTOMATION_BYPASS_SECRET`);
  mkdirSync("e2e/.auth", { recursive: true });
  await ctx.storageState({ path: BYPASS_STATE });
  await ctx.dispose();
  void config;
}
