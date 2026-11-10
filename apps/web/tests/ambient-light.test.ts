import { describe, expect, test } from "bun:test";
import {
  ambientBlurPx,
  ambientFadeGradientStops,
  ambientFadeStops,
  ambientScales,
} from "../src/lib/ambient-light";

describe("ambient light", () => {
  test("stacks full frames one 12 % edge apart up to the spread, ending at the player size", () => {
    expect(ambientScales(17)).toEqual([1.12, 1]);
    const wide = ambientScales(100);
    expect(wide).toHaveLength(9);
    expect(wide[0]).toBeCloseTo(1.96);
    expect(wide[wide.length - 1]).toBe(1);
    expect(ambientScales(0)).toEqual([1.12, 1]);
  });

  test("blurs relative to the player height like the extension", () => {
    expect(ambientBlurPx(30, 512)).toBeCloseTo(38.25);
    expect(ambientBlurPx(0, 512)).toBe(0);
  });

  test("keeps full light near the player and fades it out to nothing at the outer edge", () => {
    const stops = ambientFadeStops();
    expect(stops[0]).toEqual({ at: 0, alpha: 1 });
    expect(stops[1]).toEqual({ at: 0.15, alpha: 1 });
    expect(stops[stops.length - 1].at).toBeCloseTo(1);
    expect(stops[stops.length - 1].alpha).toBeCloseTo(0);
    for (let index = 1; index < stops.length; index += 1) {
      expect(stops[index].alpha).toBeLessThanOrEqual(stops[index - 1].alpha);
    }
  });

  test("keeps every gradient stop inside 0..1 even when float rounding overshoots", () => {
    expect((3.12 + 100 + 3.12) / (100 + 3.12 * 2)).toBeGreaterThan(1);
    for (const [size, edge] of [
      [100, 3.12],
      [360, 118.8],
      [1, 0.01],
    ]) {
      for (const stop of ambientFadeGradientStops(size, edge)) {
        expect(stop.offset).toBeGreaterThanOrEqual(0);
        expect(stop.offset).toBeLessThanOrEqual(1);
      }
    }
    expect(ambientFadeGradientStops(0, 0)).toEqual([]);
  });
});
