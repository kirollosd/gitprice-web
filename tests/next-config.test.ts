import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";

describe("www redirect", () => {
  it("308s www.gitprice.com, root included, to the apex", async () => {
    const rules = await nextConfig.redirects!();
    const www = rules.filter((r) => r.has?.some((h) => h.type === "host" && h.value === "www.gitprice.com"));
    expect(www.map((r) => [r.source, r.destination])).toEqual([
      ["/", "https://gitprice.com/"],
      ["/:path*", "https://gitprice.com/:path*"],
    ]);
    www.forEach((r) => expect(r.permanent).toBe(true));
  });
});
