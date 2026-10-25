import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";
import WaitlistForm, { isValidEmail } from "../app/components/WaitlistForm";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

const COPY = { en: en.web.component.webWaitlistForm, ar: ar.web.component.webWaitlistForm };
type Locale = keyof typeof COPY;

// The API's standard envelope: branch on status, read data.status / error.code only for detail.
const reply = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const ok = (status: number, s: "joined" | "already_joined") => reply(status, { success: true, data: { status: s }, meta: {} });
const fail = (status: number, code: string) => reply(status, { success: false, error: { code, message: code }, meta: {} });

let fetchMock: ReturnType<typeof vi.fn>;
const dl = () => ((window as unknown as { dataLayer?: { event: string }[] }).dataLayer ?? []).filter((x) => x.event === "waitlist_submit");

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  (window as unknown as { dataLayer: unknown[] }).dataLayer = [];
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.doUnmock("../lib/env");
  vi.resetModules();
});

const mount = (locale: Locale = "en", props: { audience?: "shopper" | "seller"; placement?: "hero" | "bottom"; label?: string } = {}) =>
  render(<WaitlistForm locale={locale} audience={props.audience ?? "shopper"} placement={props.placement ?? "hero"} label={props.label} />);
const field = (locale: Locale = "en") => screen.getByLabelText(COPY[locale].empty.input.email.label) as HTMLInputElement;
const submit = async (value: string, locale: Locale = "en") => {
  fireEvent.change(field(locale), { target: { value } });
  await act(async () => { fireEvent.submit(field(locale).form!); });
};

describe("isValidEmail (the API's rule)", () => {
  it.each([
    ["name@example.com", true],
    ["  name@example.com  ", true],
    ["Name@Example.co.uk", true],
    ["a@b.c", true],
    ["sara@example", false],
    ["sara smith@example.com", false],
    ["sa\u0001ra@example.com", false],
    ["é".repeat(126) + "@x.co", false],
    ["", false],
    ["   ", false],
    ["@example.com", false],
    ["name@", false],
    ["name@@example.com", false],
    ["a@b@example.com", false],
    ["name@.example.com", false],
    ["name@example.com.", false],
    ["nameexample.com", false],
    [`${"a".repeat(242)}@example.com`, true],
    [`${"a".repeat(243)}@example.com`, false],
  ])("%j -> %s", (value, expected) => expect(isValidEmail(value)).toBe(expected));
});

describe("WaitlistForm", () => {
  for (const locale of ["en", "ar"] as const) {
    const C = COPY[locale];

    it(`empty renders the board copy and the field contract (${locale})`, () => {
      mount(locale);
      const input = field(locale);
      expect(input.type).toBe("email");
      expect(input.name).toBe("email");
      expect(input.getAttribute("autocomplete")).toBe("email");
      expect(input.getAttribute("inputmode")).toBe("email");
      expect(input.getAttribute("dir")).toBe("ltr");
      expect(input.required).toBe(true);
      expect(input.placeholder).toBe(C.empty.input.email.placeholder);
      expect(screen.getByRole("button", { name: C.empty.button.submit.label })).toBeTruthy();
      expect(screen.getByText(C.empty.note)).toBeTruthy();
      const hp = document.querySelector('input[name="gp_hp"]') as HTMLInputElement;
      expect(hp.tabIndex).toBe(-1);
      expect(hp.getAttribute("autocomplete")).toBe("off");
      expect(hp.closest("[aria-hidden='true']")).not.toBeNull();
    });

    it(`error shows the message, marks and focuses the field and sends nothing (${locale})`, async () => {
      mount(locale);
      await submit(C.error.input.email.value, locale);
      expect(fetchMock).not.toHaveBeenCalled();
      const input = field(locale);
      expect(input.getAttribute("aria-invalid")).toBe("true");
      const msg = document.getElementById(input.getAttribute("aria-describedby")!.split(" ")[0])!;
      expect(msg.textContent).toBe(C.error.input.email.message);
      expect(document.activeElement).toBe(input);
      expect(screen.queryByText(C.empty.note)).toBeNull();
      expect(screen.getByRole("button", { name: C.error.button.submit.label })).toBeTruthy();
    });

    it(`submitting shows the busy label, disables the button and sends one request (${locale})`, async () => {
      fetchMock.mockReturnValue(new Promise(() => {}));
      mount(locale);
      await submit(C.submitting.input.email.value, locale);
      const button = screen.getByRole("button", { name: C.submitting.button.submit.label }) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
      expect(field(locale).form!.getAttribute("aria-busy")).toBe("true");
      expect(screen.getByText(C.submitting.note)).toBeTruthy();
      await act(async () => { fireEvent.submit(field(locale).form!); });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it(`joined replaces the form, focuses the title and fires waitlist_submit once (${locale})`, async () => {
      fetchMock.mockResolvedValue(ok(201, "joined"));
      mount(locale, { audience: "shopper", placement: "bottom" });
      await submit("sara@example.com", locale);
      const title = await screen.findByRole("heading", { name: C.joined.title });
      expect(screen.getByText(C.joined.body)).toBeTruthy();
      expect(title.tabIndex).toBe(-1);
      expect(document.activeElement).toBe(title);
      expect(document.querySelector("form")).toBeNull();
      expect(dl()).toMatchObject([{ event: "waitlist_submit", audience: "shopper", placement: "bottom" }]);
      expect(JSON.stringify(dl())).not.toContain("sara");
    });

    it(`alreadyJoined (200) shows its own copy and fires waitlist_submit once (${locale})`, async () => {
      fetchMock.mockResolvedValue(ok(200, "already_joined"));
      mount(locale);
      await submit("sara@example.com", locale);
      expect(await screen.findByRole("heading", { name: C.alreadyJoined.title })).toBeTruthy();
      expect(screen.getByText(C.alreadyJoined.body)).toBeTruthy();
      expect(dl()).toHaveLength(1);
    });

    it(`failed shows the alert, the retry label and keeps the email (${locale})`, async () => {
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
      mount(locale);
      await submit(C.failed.input.email.value, locale);
      expect((await screen.findByRole("alert")).textContent).toBe(C.failed.message);
      expect(screen.getByRole("button", { name: C.failed.button.submit.label })).toBeTruthy();
      expect(field(locale).value).toBe(C.failed.input.email.value);
      expect(screen.queryByText(C.empty.note)).toBeNull();
      expect(dl()).toHaveLength(0);
    });
  }

  it("seller forms carry the Sellers boards' note and joined body", async () => {
    const S = en.web.sellers;
    mount("en", { audience: "seller", placement: "hero" });
    expect(screen.getByText(S.prelaunch.hero.waitlist.note)).toBeTruthy();
    expect(screen.queryByText(COPY.en.empty.note)).toBeNull();
    cleanup();
    mount("ar", { audience: "seller", placement: "bottom" });
    expect(screen.getByText(ar.web.sellers.cta.waitlist.note)).toBeTruthy();
    fetchMock.mockResolvedValue(ok(201, "joined"));
    await submit("sara@example.com", "ar");
    expect(await screen.findByText(ar.web.sellers.prelaunchJoined.hero.waitlist.body)).toBeTruthy();
    expect(screen.getByRole("heading", { name: COPY.ar.joined.title })).toBeTruthy();
  });

  it("uses the label prop for the submit button", () => {
    mount("en", { label: "Get early access" });
    expect(screen.getByRole("button", { name: "Get early access" })).toBeTruthy();
  });

  it("posts the trimmed email, audience, locale and the honeypot as JSON with a timeout", async () => {
    fetchMock.mockResolvedValue(ok(201, "joined"));
    mount("ar", { audience: "seller" });
    (document.querySelector('input[name="gp_hp"]') as HTMLInputElement).value = "bot.example";
    await submit("  sara@example.com ", "ar");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8080/api/v1/waitlist");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
    expect(JSON.parse(String(init.body))).toEqual({ email: "sara@example.com", audience: "seller", locale: "ar", website: "bot.example" });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([429, 500, 503])("%i shows failed, and resubmitting retries", async (status) => {
    fetchMock.mockResolvedValueOnce(fail(status, "UNAVAILABLE")).mockResolvedValueOnce(ok(201, "joined"));
    mount();
    await submit("sara@example.com");
    expect((await screen.findByRole("alert")).textContent).toBe(COPY.en.failed.message);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: COPY.en.failed.button.submit.label })); });
    expect(await screen.findByRole("heading", { name: COPY.en.joined.title })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(dl()).toHaveLength(1);
  });

  it("400 INVALID_EMAIL shows the field error; other 400s show failed", async () => {
    fetchMock.mockResolvedValueOnce(fail(400, "INVALID_EMAIL")).mockResolvedValueOnce(fail(400, "INVALID_REQUEST"));
    mount();
    await submit("sara@example.com");
    await waitFor(() => expect(field().getAttribute("aria-invalid")).toBe("true"));
    expect(screen.getByText(COPY.en.error.input.email.message)).toBeTruthy();
    expect(document.activeElement).toBe(field());
    await act(async () => { fireEvent.submit(field().form!); });
    expect((await screen.findByRole("alert")).textContent).toBe(COPY.en.failed.message);
  });

  it("a 200 that is not the API's already_joined shows failed and fires nothing", async () => {
    fetchMock.mockResolvedValue(new Response("<html>portal</html>", { status: 200 }));
    mount();
    await submit("sara@example.com");
    expect((await screen.findByRole("alert")).textContent).toBe(COPY.en.failed.message);
    expect(dl()).toHaveLength(0);
  });

  it("typing after an invalid submit clears the field error", async () => {
    mount();
    await submit("sara@example");
    expect(field().getAttribute("aria-invalid")).toBe("true");
    fireEvent.change(field(), { target: { value: "sara@example.c" } });
    expect(field().getAttribute("aria-invalid")).toBeNull();
    expect(screen.queryByText(COPY.en.error.input.email.message)).toBeNull();
  });

  it("never logs the email", async () => {
    const spies = (["log", "warn", "error", "info"] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    mount();
    await submit("sara@example.com");
    await screen.findByRole("alert");
    for (const s of spies) expect(JSON.stringify(s.mock.calls)).not.toContain("sara@example.com");
    spies.forEach((s) => s.mockRestore());
  });
});

describe("launch switch", () => {
  const mockEnv = (launch: boolean) =>
    vi.doMock("../lib/env", () => ({
      env: {
        launch,
        apiBaseUrl: "http://localhost:8080",
        chromeStoreUrl: "https://chromewebstore.test/gitprice",
        appStoreUrl: "https://apps.test/gitprice",
        playStoreUrl: "https://play.test/gitprice",
      },
    }));
  const audiences = async () => {
    fetchMock.mockResolvedValue(ok(201, "joined"));
    const forms = [...document.querySelectorAll("form")];
    for (const f of forms) {
      fireEvent.change(f.querySelector('input[name="email"]')!, { target: { value: "sara@example.com" } });
      await act(async () => { fireEvent.submit(f); });
    }
    return fetchMock.mock.calls.map((c) => JSON.parse(String((c[1] as RequestInit).body)).audience);
  };

  it("launch=1 renders Add to Chrome and no waitlist form", async () => {
    mockEnv(true);
    const { default: HomeContent } = await import("../app/components/HomeSections");
    render(<HomeContent locale="en" />);
    const chrome = screen.getAllByRole("link", { name: "Add GitPrice to Chrome" });
    expect(chrome.length).toBeGreaterThan(0);
    chrome.forEach((a) => expect(a.getAttribute("href")).toBe("https://chromewebstore.test/gitprice"));
    expect(document.querySelector("form")).toBeNull();
  });

  it("launch=0 renders two shopper waitlist forms and no store links", async () => {
    mockEnv(false);
    const { default: HomeContent } = await import("../app/components/HomeSections");
    render(<HomeContent locale="en" />);
    expect(document.querySelectorAll("form")).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "Add GitPrice to Chrome" })).toBeNull();
    expect(await audiences()).toEqual(["shopper", "shopper"]);
  });

  it("launch=0 sellers page sends audience=seller from both forms", async () => {
    mockEnv(false);
    const { default: SellersPage } = await import("../app/[locale]/sellers/page");
    render(await SellersPage({ params: Promise.resolve({ locale: "en" }) }));
    expect(document.querySelectorAll("form")).toHaveLength(2);
    expect(await audiences()).toEqual(["seller", "seller"]);
  });

  it("store badges link to both app stores and use localized labels", async () => {
    mockEnv(true);
    const { default: StoreBadges } = await import("../app/components/StoreBadges");
    render(<StoreBadges locale="en" placement="hero" />);
    expect(screen.getByRole("link", { name: /App Store/ }).getAttribute("href")).toBe("https://apps.test/gitprice");
    expect(screen.getByRole("link", { name: /Google Play/ }).getAttribute("href")).toBe("https://play.test/gitprice");
  });
});
