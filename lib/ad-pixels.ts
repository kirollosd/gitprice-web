export type AdEvent = "PageView" | "cws_click" | "send_to_desktop";

type Fbq = ((...args: unknown[]) => void) & { queue?: unknown[] };
type Ttq = {
  track?: (...args: unknown[]) => void;
  page?: (...args: unknown[]) => void;
  load?: (...args: unknown[]) => void;
};

type Win = { fbq?: Fbq; ttq?: Ttq };

/** Meta Pixel bootstrap (https://developers.facebook.com/docs/meta-pixel/get-started). */
export function metaPixelSnippet(id: string): string {
  return (
    `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?` +
    `n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;` +
    `n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;` +
    `t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}` +
    `(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');` +
    `fbq('init',${JSON.stringify(id)});fbq('track','PageView');`
  );
}

/** TikTok Pixel bootstrap (https://ads.tiktok.com/help/article/advanced-matching-web). */
export function tiktokPixelSnippet(id: string): string {
  return (
    `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];` +
    `ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];` +
    `ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};` +
    `for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);` +
    `ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";` +
    `var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=r+"?sdkid="+e+"&lib="+t;` +
    `var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};` +
    `ttq.load(${JSON.stringify(id)});ttq.page()}(window,document,'ttq');`
  );
}

/** Best-effort Meta / TikTok custom events. Never throws. */
export function pushAdEvent(name: AdEvent): void {
  try {
    const w = window as unknown as Win;
    if (name === "PageView") {
      try { w.fbq?.("track", "PageView"); } catch { /* noop */ }
      try { w.ttq?.page?.(); } catch { /* noop */ }
      return;
    }
    try { w.fbq?.("trackCustom", name); } catch { /* noop */ }
    try { w.ttq?.track?.(name); } catch { /* noop */ }
  } catch { /* analytics must never break the page */ }
}
