import { describe, expect, it } from "vitest";
import { config } from "../middleware";

const re = new RegExp(`^${config.matcher[0]}$`);

describe("middleware matcher", () => {
  it("skips internals and files", () => {
    for (const p of ["/_next/static/a.js", "/api", "/api/x", "/fonts/a.woff2", "/_vercel/x", "/favicon.ico", "/robots.txt", "/en/opengraph-image", "/ar/opengraph-image"]) {
      expect(re.test(p), p).toBe(false);
    }
  });
  it("matches pages, including names that merely start with an excluded one", () => {
    for (const p of ["/", "/privacy", "/ar/terms", "/apiary", "/fontsize", "/_nextra"]) {
      expect(re.test(p), p).toBe(true);
    }
  });
});
