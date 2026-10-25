import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@vercel/analytics/react", () => ({ Analytics: () => <div data-testid="va" /> }));
vi.mock("@vercel/speed-insights/next", () => ({ SpeedInsights: () => <div data-testid="si" /> }));

import Analytics from "../app/components/Analytics";

afterEach(() => {
  cleanup();
  document.cookie = "gp_consent=; Max-Age=0; path=/";
});

describe("Analytics", () => {
  it("renders Vercel Analytics and Speed Insights before consent", () => {
    render(<Analytics />);
    expect(screen.getByTestId("va")).toBeTruthy();
    expect(screen.getByTestId("si")).toBeTruthy();
  });

  it("keeps both after consent is allowed", () => {
    document.cookie = "gp_consent=allow; path=/";
    render(<Analytics />);
    expect(screen.getByTestId("va")).toBeTruthy();
    expect(screen.getByTestId("si")).toBeTruthy();
  });
});
