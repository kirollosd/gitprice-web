import { NextResponse, type NextRequest } from "next/server";
import { suggestLocale } from "./lib/locale";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308); // query preserved by clone
  }
  if (pathname === "/ar" || pathname.startsWith("/ar/")) {
    const res = NextResponse.next();
    if (req.cookies.has("gp_suggest")) res.cookies.set("gp_suggest", "", { path: "/", maxAge: 0 });
    return res;
  }

  const url = req.nextUrl.clone();
  url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  url.search = search;
  const res = NextResponse.rewrite(url);

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
