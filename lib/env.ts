export type SiteEnv = {
  launch: boolean;
  chromeStoreUrl?: string;
  appStoreUrl?: string;
  playStoreUrl?: string;
  tallyFormId: string;
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  heapId?: string;
  siteUrl: string;
};

const REQUIRED = {
  tallyFormId: "NEXT_PUBLIC_TALLY_FORM_ID",
  apiBaseUrl: "NEXT_PUBLIC_API_BASE_URL",
  supabaseUrl: "NEXT_PUBLIC_SUPABASE_URL",
  supabaseAnonKey: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  siteUrl: "NEXT_PUBLIC_SITE_URL",
} as const;

const STORES = {
  chromeStoreUrl: "NEXT_PUBLIC_CHROME_STORE_URL",
  appStoreUrl: "NEXT_PUBLIC_APP_STORE_URL",
  playStoreUrl: "NEXT_PUBLIC_PLAY_STORE_URL",
} as const;

export function readEnv(src: Record<string, string | undefined>): SiteEnv {
  const get = (name: string) => src[name]?.trim() || undefined;
  const launch = get("NEXT_PUBLIC_LAUNCH") === "1";

  const needed: Record<string, string> = { ...REQUIRED, ...(launch ? STORES : {}) };
  const missing = Object.values(needed).filter((name) => !get(name));
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  return {
    launch,
    chromeStoreUrl: get(STORES.chromeStoreUrl),
    appStoreUrl: get(STORES.appStoreUrl),
    playStoreUrl: get(STORES.playStoreUrl),
    tallyFormId: get(REQUIRED.tallyFormId)!,
    apiBaseUrl: get(REQUIRED.apiBaseUrl)!,
    supabaseUrl: get(REQUIRED.supabaseUrl)!,
    supabaseAnonKey: get(REQUIRED.supabaseAnonKey)!,
    heapId: get("NEXT_PUBLIC_HEAP_ID"),
    siteUrl: get(REQUIRED.siteUrl)!,
  };
}

// Next inlines NEXT_PUBLIC_* only for literal property access, so pass them explicitly.
export const env: SiteEnv = readEnv({
  NEXT_PUBLIC_LAUNCH: process.env.NEXT_PUBLIC_LAUNCH,
  NEXT_PUBLIC_CHROME_STORE_URL: process.env.NEXT_PUBLIC_CHROME_STORE_URL,
  NEXT_PUBLIC_APP_STORE_URL: process.env.NEXT_PUBLIC_APP_STORE_URL,
  NEXT_PUBLIC_PLAY_STORE_URL: process.env.NEXT_PUBLIC_PLAY_STORE_URL,
  NEXT_PUBLIC_TALLY_FORM_ID: process.env.NEXT_PUBLIC_TALLY_FORM_ID,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_HEAP_ID: process.env.NEXT_PUBLIC_HEAP_ID,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
