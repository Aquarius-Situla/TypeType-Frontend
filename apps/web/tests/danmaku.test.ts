import { describe, expect, it } from "bun:test";
import { argbToColor, displayDuration, N_LANES, REGULAR_DISPLAY_MS } from "../src/lib/danmaku";

describe("danmaku utilities", () => {
  it("converts ARGB color to CSS hex color correctly", () => {
    expect(argbToColor(0xffffffff)).toBe("#ffffff");
    expect(argbToColor(0xffff0000)).toBe("#ff0000");
    expect(argbToColor(0xff00ff00)).toBe("#00ff00");
    expect(argbToColor(0xff0000ff)).toBe("#0000ff");
    expect(argbToColor(0x002e72)).toBe("#002e72");
  });

  it("calculates displayDuration for regular vs static positions", () => {
    expect(displayDuration("REGULAR")).toBe(REGULAR_DISPLAY_MS);
    expect(displayDuration("TOP")).toBe(3000);
    expect(displayDuration("BOTTOM")).toBe(3000);
    expect(displayDuration("SUPERCHAT")).toBe(3000);
  });

  it("provides expected lane count", () => {
    expect(N_LANES).toBe(8);
  });
});
