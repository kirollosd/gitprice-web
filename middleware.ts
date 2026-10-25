import { NextResponse, type NextRequest } from "next/server";
import { env } from "./lib/env";
import { suggestLocale } from "./lib/locale";

// notFound() from a page under the [locale] root layout renders Next's bare error document (no lang or dir), so while
// checkout is off its pages are rewritten to a path no route matches and app/global-not-found renders instead.
const CHECKOUT = /^\/checkout(\/return)?\/?$/;
const NOT_FOUND = "/__gp404";
const hidden = (rest: string) => !env.checkout && CHECKOUT.test(rest);

/** The routed locale, for app/global-not-found (it has no params). */
function withLocale(req: NextRequest, locale: "en" | "ar"): Headers {
  const headers = new Headers(req.headers);
  headers.set("x-gp-locale", locale);
  return headers;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308); // query preserved by clone
  }
  if (pathname === "/ar" || pathname.startsWith("/ar/")) {
    const headers = withLocale(req, "ar");
    const res = hidden(pathname.slice(3))
      ? NextResponse.rewrite(new URL(`/ar${NOT_FOUND}`, req.url), { request: { headers } })
      : NextResponse.next({ request: { headers } });
    if (req.cookies.has("gp_suggest")) res.cookies.set("gp_suggest", "", { path: "/", maxAge: 0 });
    return res;
  }

  const off = hidden(pathname);
  const url = req.nextUrl.clone();
  url.pathname = `/en${off ? NOT_FOUND : pathname === "/" ? "" : pathname}`;
  url.search = off ? "" : search;
  const res = NextResponse.rewrite(url, { request: { headers: withLocale(req, "en") } });

  const dismissed = req.cookies.get("gp_suggest_dismissed")?.value === "1";
  if (!dismissed && suggestLocale(req.headers.get("accept-language"), "en") === "ar") {
    res.headers.set("x-gp-suggest", "ar");
    // Readable by the client suggestion banner so pages stay static. Session cookie.
    res.cookies.set("gp_suggest", "ar", { path: "/", sameSite: "lax", httpOnly: false, secure: req.nextUrl.protocol === "https:" });
  }
  return res;
}

export const config = {
  // The per-locale share image is served at its real /en or /ar path; skipping it avoids the /en 308.
  matcher: ["/((?!(?:_next|api|fonts|_vercel)(?:/|$)|.*\\..*|(?:en|ar)/opengraph-image).*)"],
};
