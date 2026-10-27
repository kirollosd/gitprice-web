import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
let path = "/sellers";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }), usePathname: () => path }));

beforeEach(() => { push.mockClear(); path = "/sellers"; });
afterEach(cleanup);

async function menu(locale: "en" | "ar" = "en") {
  const { default: LangMenu } = await import("../app/landing/LangMenu");
  render(<div><LangMenu locale={locale} /><button type="button">elsewhere</button></div>);
  return { btn: screen.getByRole("button", { name: locale === "ar" ? "اللغة" : "Language" }), list: document.getElementById("lmenu")! };
}

describe("LangMenu", () => {
  it("is closed at first and shows the current language", async () => {
    const { btn, list } = await menu();
    expect(list.hidden).toBe(true);
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(btn.getAttribute("aria-haspopup")).toBe("listbox");
    expect(document.getElementById("lcur")!.textContent).toBe("EN");
  });

  it("Enter opens it on the current language; Esc closes it and returns focus to the button", async () => {
    const { btn, list } = await menu();
    btn.focus();
    act(() => { fireEvent.keyDown(btn, { key: "Enter" }); });
    expect(list.hidden).toBe(false);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    const en = list.querySelector('[lang="en"]');
    expect(document.activeElement).toBe(en);
    expect(en?.getAttribute("aria-selected")).toBe("true");
    act(() => { fireEvent.keyDown(document.activeElement!, { key: "Escape" }); });
    expect(list.hidden).toBe(true);
    expect(document.activeElement).toBe(btn);
  });

  it("the Arabic item carries lang=ar and no dir; arrows move between items", async () => {
    const { btn, list } = await menu();
    act(() => { fireEvent.click(btn); });
    const ar = list.querySelector('[role="option"][lang="ar"]')!;
    expect(ar.hasAttribute("dir")).toBe(false);
    expect([...list.querySelectorAll("[dir]")]).toHaveLength(0);
    act(() => { fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" }); });
    expect(document.activeElement).toBe(ar);
    act(() => { fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" }); });
    expect(document.activeElement?.getAttribute("lang")).toBe("en");
  });

  it("picking the other language navigates with switchPath; the current one just closes", async () => {
    const { btn, list } = await menu();
    act(() => { fireEvent.click(btn); });
    act(() => { fireEvent.click(list.querySelector('[lang="en"]')!); });
    expect(push).not.toHaveBeenCalled();
    expect(list.hidden).toBe(true);
    act(() => { fireEvent.click(btn); });
    act(() => { fireEvent.keyDown(list.querySelector('[lang="ar"]')!, { key: "Enter" }); });
    expect(push).toHaveBeenCalledWith("/ar/sellers");
  });

  it("an outside pointerdown closes it; in Arabic the button reads ع", async () => {
    path = "/ar";
    const { btn, list } = await menu("ar");
    expect(document.getElementById("lcur")!.textContent).toBe("ع");
    act(() => { fireEvent.click(btn); });
    act(() => { fireEvent.pointerDown(screen.getByText("elsewhere")); });
    expect(list.hidden).toBe(true);
  });
});
