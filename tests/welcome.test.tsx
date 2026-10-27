import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import WelcomePage from "../app/[locale]/welcome/page";
import en from "../i18n/en.json";

afterEach(cleanup);

describe("Welcome step art", () => {
  it("draws the pin icons and the badge, decorative, from existing keys", async () => {
    const { container } = render(await WelcomePage({ params: Promise.resolve({ locale: "en" }) }));
    const pin = container.querySelector('[data-art="welcome-pin"]')!;
    const badge = container.querySelector('[data-art="welcome-badge"]')!;
    expect(pin.getAttribute("aria-hidden")).toBe("true");
    expect(badge.getAttribute("aria-hidden")).toBe("true");
    expect(badge.textContent).toBe("23,749 on Store B · 1,250 less");
    // The sign-in line stays plain text: no link.
    expect(container.querySelector("strong")!.textContent).toBe(en.web.welcome.signin.link);
    expect(container.querySelector("a")).toBeNull();
  });

  it("uses the Arabic clause in Arabic", async () => {
    const { container } = render(await WelcomePage({ params: Promise.resolve({ locale: "ar" }) }));
    expect(container.querySelector('[data-art="welcome-badge"]')!.textContent).toBe("23,749 في المتجر ب · أقل بـ 1,250");
  });
});
