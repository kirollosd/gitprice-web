import { env } from "./env";

/**
 * The website's outbound shop link (GP-905): the API's /out records the click, then /go builds the link from the
 * backoffice link rules as they are at click time, so a rule edit needs no rebuild. Pass the plain shop URL.
 */
export function outUrl(shopUrl: string, from: "stores" | "deals"): string {
  return `${env.apiBaseUrl}/api/v1/out?${new URLSearchParams({ url: shopUrl, from })}`;
}
