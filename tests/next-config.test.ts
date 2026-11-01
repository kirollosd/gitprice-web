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

describe("Referrer-Policy", () => {
  const policy = async (path: string) => {
    const rules = await nextConfig.headers!();
    const hits = rules
      .filter((r) => new RegExp(`^${r.source.replace(/:path\*/g, ".*")}$`).test(path))
      .flatMap((r) => r.headers.filter((h) => h.key === "Referrer-Policy").map((h) => h.value));
    return hits.at(-1);
  };
  it("is no-referrer on the auth pages in both locales", async () => {
    for (const p of ["/auth/confirm", "/auth/confirmed", "/ar/auth/confirm", "/ar/auth/confirmed"]) expect(await policy(p)).toBe("no-referrer");
  });
  it("is strict-origin-when-cross-origin site-wide", async () => {
    expect(await policy("/")).toBe("strict-origin-when-cross-origin");
    expect(await policy("/privacy")).toBe("strict-origin-when-cross-origin");
  });
});
