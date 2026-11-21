/**
 * A failed API read during `next build` renders the empty state so the build succeeds.
 * At runtime it rethrows: a throwing ISR revalidation keeps serving the last good page,
 * while a returned empty list would be cached as the page until the next revalidation.
 */
export function emptyAtBuild<T>(empty: T, cause: unknown): T {
  if (process.env.NEXT_PHASE === "phase-production-build") return empty;
  throw cause instanceof Error ? cause : new Error(String(cause));
}
