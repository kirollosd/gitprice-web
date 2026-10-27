import { act, cleanup, fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubMotion } from "./landing-stubs";

const replace = vi.fn();
let query = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(query),
  usePathname: () => "/",
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

beforeEach(() => { replace.mockClear(); query = ""; stubMotion(true); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function home() {
  const { default: HomeContent } = await import("../app/components/HomeSections");
  return render(<HomeContent locale="en" />);
}
const digits = () => document.querySelector("#digits") as HTMLElement;
const chip = (id: string) => document.querySelector(`#pick button[data-id="${id}"]`) as HTMLButtonElement;

describe("ProductPicker", () => {
  it("choosing iphone writes ?p=iphone without scrolling and rolls the hero to the iphone prices", async () => {
    const { products } = await import("../app/landing/products");
    const { money } = await import("../app/landing/Price");
    const iphone = products.find((p) => p.id === "iphone")!;
    await home();
    expect(digits().dataset.from).toBe("699");
    act(() => { fireEvent.click(chip("iphone")); });
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace.mock.calls[0][0]).toMatch(/\?p=iphone$/);
    expect(replace.mock.calls[0][1]).toEqual({ scroll: false });
    expect(digits().dataset.from).toBe(money(iphone.from, 0));
    expect(digits().dataset.to).toBe(money(iphone.best.price, 0));
    expect(chip("iphone").getAttribute("aria-pressed")).toBe("true");
    expect(chip("charger").getAttribute("aria-pressed")).toBe("false");
    // the other sections follow: the receipt's first line and the footer price
    expect(document.querySelector("#items > div")?.textContent).toContain(iphone.name);
    expect(document.querySelector("#refname")?.textContent).toBe(iphone.name);
  });

  it("reads ?p= on load and falls back to the charger for an unknown id", async () => {
    query = "p=pampers";
    await home();
    expect(chip("pampers").getAttribute("aria-pressed")).toBe("true");
    cleanup();
    query = "p=nope";
    await home();
    expect(chip("charger").getAttribute("aria-pressed")).toBe("true");
    expect(digits().dataset.from).toBe("699");
  });

  it("tells the scenes the content changed (gp:product) once the new product is on the page", async () => {
    await home();
    const seen: string[] = [];
    const on = () => seen.push(document.querySelector("#refname")?.textContent ?? "");
    addEventListener("gp:product", on);
    act(() => { fireEvent.click(chip("cerave")); });
    removeEventListener("gp:product", on);
    const { products } = await import("../app/landing/products");
    expect(seen).toEqual([products.find((p) => p.id === "cerave")!.name]);
  });

  it("does nothing when the current product is picked again", async () => {
    await home();
    act(() => { fireEvent.click(chip("charger")); });
    expect(replace).not.toHaveBeenCalled();
  });
});
