import { describe, expect, test } from "bun:test";
import { hallImpulseChannels } from "../src/halloween/hall-reverb";

describe("hallImpulseChannels", () => {
  test("is silent during the pre-delay and decays afterwards", () => {
    let seed = 1;
    const random = (): number => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const [left] = hallImpulseChannels(
      1000,
      { seconds: 2, decay: 3, preDelaySeconds: 0.1 },
      random,
    );
    expect(left).toHaveLength(2000);
    expect(left.slice(0, 100).every((value) => value === 0)).toBe(true);
    const energy = (from: number, to: number): number =>
      left.slice(from, to).reduce((sum, value) => sum + value * value, 0);
    expect(energy(100, 400)).toBeGreaterThan(energy(1400, 1700) * 10);
  });
});
