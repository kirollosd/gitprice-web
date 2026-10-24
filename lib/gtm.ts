/** Runs before any bundle: consent starts denied, and a returning Allow is restored before GTM loads. */
export function consentDefaultScript(): string {
  return `window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments);}gtag("consent","default",{ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",analytics_storage:"denied",wait_for_update:500});if(/(^|; )gp_consent=allow(;|$)/.test(document.cookie))gtag("consent","update",{analytics_storage:"granted"});`;
}

/** Google's standard GTM loader snippet. */
export function gtmScript(id: string): string {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({"gtm.start":new Date().getTime(),event:"gtm.js"});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!="dataLayer"?"&l="+l:"";j.async=true;j.src="https://www.googletagmanager.com/gtm.js?id="+i+dl;f.parentNode.insertBefore(j,f);})(window,document,"script","dataLayer",${JSON.stringify(id)});`;
}

/** Pushes onto window.dataLayer (created if missing). GTM reads the arguments object form, not an array. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- GTM needs the real arguments object, so the rest param only types the call
export function gtag(..._args: unknown[]): void {
  try {
    const w = window as unknown as { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer || [];
    
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  } catch { /* analytics must never break the page */ }
}
