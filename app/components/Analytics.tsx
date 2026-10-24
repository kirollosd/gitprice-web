"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import Script from "next/script";
import { useSyncExternalStore } from "react";
import { CONSENT_EVENT, readConsent, type Consent } from "../../lib/consent";
import { env } from "../../lib/env";

const subscribe = (cb: () => void) => {
  window.addEventListener(CONSENT_EVENT, cb);
  return () => window.removeEventListener(CONSENT_EVENT, cb);
};
const getConsent = (): Consent => readConsent(document.cookie);
const getServerConsent = (): Consent => null;

// Heap's documented install snippet (https://developers.heap.io/docs/web).
const heapSnippet = (id: string) =>
  `window.heapReadyCb=window.heapReadyCb||[],window.heap=window.heap||[],heap.load=function(e,t){window.heap.envId=e,window.heap.clientConfig=t=t||{},window.heap.clientConfig.shouldFetchServerConfig=!1;var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src="https://cdn.us.heap-api.com/config/"+e+"/heap_config.js";var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(a,r);var n=["init","startTracking","stopTracking","track","resetIdentity","identify","identifyHashed","getSessionId","getUserId","getIdentity","addUserProperties","addEventProperties","removeEventProperty","clearEventProperties","addAccountProperties","addAdapter","addTransformer","addTransformerFn","onReady","addPageviewProperties","removePageviewProperty","clearPageviewProperties","trackPageview"],i=function(e){return function(){var t=Array.prototype.slice.call(arguments,0);window.heapReadyCb.push({name:e,fn:function(){heap[e]&&heap[e].apply(heap,t)}})}};for(var p=0;p<n.length;p++)heap[n[p]]=i(n[p])};heap.load(${JSON.stringify(id)});`;

/** Vercel Analytics is cookieless and always on. Heap loads only after Allow. */
export default function Analytics() {
  const consent = useSyncExternalStore(subscribe, getConsent, getServerConsent);
  return (
    <>
      <VercelAnalytics />
      {consent === "allow" && env.heapId && process.env.NODE_ENV === "production" ? <Script id="heap" strategy="afterInteractive">{heapSnippet(env.heapId)}</Script> : null}
    </>
  );
}
