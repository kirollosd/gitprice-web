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
