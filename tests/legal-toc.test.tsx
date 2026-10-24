import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import LegalPage from "../app/components/LegalPage";
import en from "../i18n/en.json";

afterEach(cleanup);
const L = en.web.component.webLegalToc.terms.label;

describe("Legal contents indicator", () => {
  it("marks the first section current, then the clicked one", () => {
    render(<LegalPage locale="en" name="terms" />);
    const current = () => screen.getByRole("navigation").querySelectorAll('[aria-current="location"]');
    expect(current()).toHaveLength(1);
    expect(current()[0].textContent).toBe(L.section1);
    fireEvent.click(screen.getByRole("link", { name: L.section3 }));
    expect(current()).toHaveLength(1);
    expect(current()[0].textContent).toBe(L.section3);
  });
});
