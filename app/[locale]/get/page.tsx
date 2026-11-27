import type { Metadata } from "next";
import { headers } from "next/headers";
import GetLanding from "../../components/GetLanding";
import { isPhoneUserAgent } from "../../../lib/device";
import { env } from "../../../lib/env";
import { t, type Locale } from "../../../lib/i18n";
import { pageMeta } from "../../../lib/seo";
import { chromeStoreUrlWithUtms, parseUtms } from "../../../lib/utm";

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMeta(locale, "/get", {
    title: t(locale, "web.get.title"),
    description: t(locale, "web.get.description"),
  });
}

function toSearchParams(raw: Record<string, string | string[] | undefined>): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") sp.set(key, value);
    else if (Array.isArray(value) && value[0]) sp.set(key, value[0]);
  }
  return sp;
}

export default async function GetPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const utms = parseUtms(toSearchParams(await searchParams));
  const ua = (await headers()).get("user-agent") ?? "";
  const phone = isPhoneUserAgent(ua);
  const base = env.chromeStoreUrl || "https://chromewebstore.google.com/";
  const chromeHref = chromeStoreUrlWithUtms(base, utms);
  return (
    <GetLanding
      locale={locale}
      phone={phone}
      chromeHref={chromeHref}
      utms={utms}
      turnstileSiteKey={env.turnstileSiteKey}
    />
  );
}
