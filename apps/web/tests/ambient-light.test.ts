import { describe, expect, test } from "bun:test";
import {
  ambientBlurPx,
  ambientFadeStops,
  ambientScales,
  isAmbientLightActive,
} from "../src/lib/ambient-light";

const base = { enabled: true, cinemaMode: false, webFullscreen: false, audioOnly: false };

describe("ambient light", () => {
  test("lights the watch page only when enabled with a visible video", () => {
    expect(isAmbientLightActive(base)).toBe(true);
    expect(isAmbientLightActive({ ...base, enabled: false })).toBe(false);
    expect(isAmbientLightActive({ ...base, cinemaMode: true })).toBe(false);
    expect(isAmbientLightActive({ ...base, webFullscreen: true })).toBe(false);
    expect(isAmbientLightActive({ ...base, audioOnly: true })).toBe(false);
  });

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
});
