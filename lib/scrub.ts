/**
 * Inline script, first in <head> (before consent defaults, GTM, GA4 and every bundle). Auth emails used to land on
 * `/#access_token=...`; GTM reads location.href at load, so the fragment must be gone before it runs. The removed hash
 * is kept in memory (window.__gpAuthHash) so the reset-password page can still finish a legacy implicit link.
 */
export const TOKEN_SCRUB_SCRIPT = `if(/access_token|refresh_token|token_hash|error_description|type=/.test(location.hash)){window.__gpAuthHash=location.hash;history.replaceState(null,"",location.pathname+location.search);}`;
