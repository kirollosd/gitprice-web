import { describe, expect, it } from "vitest";
import { outUrl } from "../lib/outbound";

describe("outUrl", () => {
  it("sends the plain shop url through the API's click-tracked /out, encoded", () => {
    expect(outUrl("https://www.noon.com/egypt-en/?q=a&b=1", "deals")).toBe(
      "http://localhost:8080/api/v1/out?url=https%3A%2F%2Fwww.noon.com%2Fegypt-en%2F%3Fq%3Da%26b%3D1&from=deals",
    );
  });
});
