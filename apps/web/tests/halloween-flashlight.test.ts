import { describe, expect, test } from "bun:test";
import { lampLevel, lampRadius } from "../src/halloween/flashlight";

describe("lampLevel", () => {
  test("warms up to full brightness after switching on", () => {
    expect(lampLevel(true, 1000, 1000)).toBe(0);
    expect(lampLevel(true, 1000, 1200)).toBe(1);
  });

  test("stays within [0, 1] during the warm-up flutter", () => {
    for (let ms = 0; ms <= 100; ms += 1) {
      const level = lampLevel(true, 0, ms);
      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(1);
    }
  });

  test("goes dark quickly after switching off", () => {
    expect(lampLevel(false, 0, 0)).toBe(1);
    expect(lampLevel(false, 0, 30)).toBeCloseTo(0.5, 5);
    expect(lampLevel(false, 0, 200)).toBe(0);
  });
});

describe("lampRadius", () => {
  test("scales with the smaller viewport side", () => {
    expect(lampRadius(1440, 900)).toBeCloseTo(220, 5);
    expect(lampRadius(390, 844)).toBeCloseTo(118, 5);
  });
});
