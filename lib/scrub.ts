/**
 * Inline script, first in <head> (before consent defaults, GTM, GA4, Heap, Vercel Analytics and every bundle). Auth emails
 * land on `/#access_token=...` or `?token_hash=...`; analytics reads location.href at load, so the secrets must be gone first.
 *
 * - Fragment: removed on every page when it carries one of the exact keys below.
 * - Query: `token_hash`, `token`, `code`, `type` are removed on /auth/*, /reset-password and their /ar twins only.
 * - On those four paths the removed values wait in a closure behind `window.__gpTake()`: non-enumerable, non-writable, returns
 *   them once and deletes itself; also cleared on pagehide and after 60 s. Everywhere else they are simply discarded.
 *
 * A future CSP must allow this script by hash or nonce (it is inline), or tokens will reach analytics again.
 * e2e/auth.spec.ts fails when it does not run: the GTM stub records location.href at load.
 */
const KEYS = "access_token|refresh_token|provider_token|provider_refresh_token|token_hash|code|error|error_code|error_description|type";

export const TOKEN_SCRUB_SCRIPT =
  `(function(w){var l=w.location,h=w.history,` +
  `a=/^(\\/ar)?\\/(auth|reset-password)(\\/|$)/.test(l.pathname),` +
  `f=new RegExp("(^|[#&])(${KEYS})=").test(l.hash),` +
  `q=new URLSearchParams(l.search),s=l.search,x=l.hash,d=false;` +
  `if(a)["token_hash","token","code","type"].forEach(function(k){if(q.has(k)){q.delete(k);d=true}});` +
  `if(!f&&!d)return;` +
  `var r=q.toString();h.replaceState(h.state,"",l.pathname+(r?"?"+r:""));` +
  `if(!a)return;` +
  `var v={search:s,hash:x};` +
  `function c(){v=null;try{delete w.__gpTake}catch(e){}}` +
  `Object.defineProperty(w,"__gpTake",{value:function(){var o=v;c();return o},enumerable:false,writable:false,configurable:true});` +
  `w.addEventListener("pagehide",c);w.setTimeout(c,6e4);` +
  `})(window);`;
