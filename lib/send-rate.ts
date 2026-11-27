import { Redis } from "@upstash/redis";

type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();
const memoryEmailCooldown = new Map<string, number>();

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  redis = url && token ? Redis.fromEnv() : null;
  return redis;
}

function memoryHit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hit = memoryBuckets.get(key);
  if (!hit || hit.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (hit.count >= max) return true;
  hit.count += 1;
  return false;
}

/** True when the IP should be rejected (already at/over max). */
export async function hitIpLimit(ip: string, max: number, windowMs: number): Promise<boolean> {
  const key = `std:ip:${ip}`;
  const client = getRedis();
  if (!client) return memoryHit(key, max, windowMs);

  try {
    const count = await client.incr(key);
    if (count === 1) await client.pexpire(key, windowMs);
    return count > max;
  } catch {
    // Redis down: soft-fail open to memory so a KV outage does not 500 the form.
    return memoryHit(key, max, windowMs);
  }
}

export async function isEmailCoolingDown(email: string): Promise<boolean> {
  const key = `std:email:${email}`;
  const client = getRedis();
  if (!client) {
    const until = memoryEmailCooldown.get(key);
    return !!until && until > Date.now();
  }
  try {
    const until = await client.get<number>(key);
    return typeof until === "number" && until > Date.now();
  } catch {
    const until = memoryEmailCooldown.get(key);
    return !!until && until > Date.now();
  }
}

/** Call only after Resend accepts the message — never lock on 4xx/5xx. */
export async function markEmailSent(email: string, cooldownMs: number): Promise<void> {
  const key = `std:email:${email}`;
  const until = Date.now() + cooldownMs;
  const client = getRedis();
  if (!client) {
    memoryEmailCooldown.set(key, until);
    return;
  }
  try {
    await client.set(key, until, { px: cooldownMs });
  } catch {
    memoryEmailCooldown.set(key, until);
  }
}

/** Test-only: clear memory stores and redis client cache. */
export function __resetSendRateForTests(): void {
  memoryBuckets.clear();
  memoryEmailCooldown.clear();
  redis = undefined;
}
