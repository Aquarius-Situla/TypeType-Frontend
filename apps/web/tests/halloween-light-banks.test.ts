import { describe, expect, test } from "bun:test";
import { BANK_COUNT, bankAlpha, bankGradientStops, DARK_ALPHA } from "../src/halloween/light-banks";

describe("bankAlpha", () => {
  test("stays lit before the switch", () => {
    expect(bankAlpha(0)).toBe(0);
    expect(bankAlpha(-50)).toBe(0);
  });

  test("drops fast, then settles into full darkness", () => {
    expect(bankAlpha(30)).toBeGreaterThan(0.4);
    expect(bankAlpha(60)).toBeCloseTo(0.9, 5);
    expect(bankAlpha(5000)).toBeCloseTo(DARK_ALPHA, 5);
  });

  test("never gets lighter while the afterglow fades", () => {
    let previous = 0;
    for (let ms = 0; ms <= 1200; ms += 10) {
      const alpha = bankAlpha(ms);
      expect(alpha).toBeGreaterThanOrEqual(previous);
      previous = alpha;
    }
  });
});

describe("bankGradientStops", () => {
  test("maps bank 0 to the right edge and the last bank to the left edge", () => {
    const alphas = [0.9, 0, 0, 0.2];
    const stops = bankGradientStops(alphas, 0.03);
    expect(stops).toHaveLength(BANK_COUNT * 2);
    expect(stops[0]).toEqual({ offset: 0, alpha: 0.2 });
    expect(stops.at(-1)).toEqual({ offset: 1, alpha: 0.9 });
  });

  test("keeps offsets ordered inside [0, 1]", () => {
    const stops = bankGradientStops([1, 1, 1, 1], 0.03);
    for (let i = 1; i < stops.length; i += 1) {
      expect(stops[i]?.offset ?? 0).toBeGreaterThanOrEqual(stops[i - 1]?.offset ?? 0);
    }
    expect(stops.every((stop) => stop.offset >= 0 && stop.offset <= 1)).toBe(true);
  });
});
