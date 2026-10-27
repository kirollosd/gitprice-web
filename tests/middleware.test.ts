import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "../middleware";

const suggest = (url: string) =>
  middleware(new NextRequest(url, { headers: { "accept-language": "ar-EG" } })).headers.get("set-cookie") ?? "";

describe("gp_suggest cookie", () => {
  it("is Secure over https", () => {
    expect(suggest("https://gitprice.app/")).toMatch(/gp_suggest=ar.*Secure/i);
  });
  it("is not Secure on http localhost, so dev and e2e keep working", () => {
    const c = suggest("http://localhost:3000/");
    expect(c).toContain("gp_suggest=ar");
    expect(c).not.toMatch(/secure/i);
  });
});

describe("x-gp-locale request header (for app/global-not-found)", () => {
  const routed = (url: string) => middleware(new NextRequest(url)).headers.get("x-middleware-request-x-gp-locale");
  it("is ar under /ar and en on the rewritten English paths", () => {
    expect(routed("http://localhost:3000/ar/nope")).toBe("ar");
    expect(routed("http://localhost:3000/nope")).toBe("en");
  });
});

describe("checkout while NEXT_PUBLIC_CHECKOUT is off", () => {
  const rewrite = (url: string) => middleware(new NextRequest(url)).headers.get("x-middleware-rewrite") ?? "";
  it("rewrites the checkout pages to an unmatched path, so global-not-found sets lang and dir", () => {
    expect(rewrite("http://localhost:3000/checkout")).toBe("http://localhost:3000/en/__gp404");
    expect(rewrite("http://localhost:3000/checkout/return?code=x")).toBe("http://localhost:3000/en/__gp404");
    expect(rewrite("http://localhost:3000/ar/checkout/")).toBe("http://localhost:3000/ar/__gp404");
  });
  it("leaves look-alike paths alone", () => {
    expect(rewrite("http://localhost:3000/checkoutx")).toBe("http://localhost:3000/en/checkoutx");
    expect(rewrite("http://localhost:3000/ar/checkoutx")).toBe("");
  });
});
