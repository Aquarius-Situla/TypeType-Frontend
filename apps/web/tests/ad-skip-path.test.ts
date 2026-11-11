import { expect, test } from "bun:test";
import { exitSpot, fleeSpot, runSeconds } from "../src/lib/ad-skip-path";

function sequence(values: number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length] ?? 0;
}

test("the skip button flees to a spot inside the frame, away from the pointer", () => {
  const pointer = { left: 60, top: 60 };
  for (let run = 0; run < 200; run += 1) {
    const spot = fleeSpot({ left: 58, top: 58 }, pointer);
    expect(spot.left).toBeGreaterThanOrEqual(4);
    expect(spot.left).toBeLessThanOrEqual(72);
    expect(spot.top).toBeGreaterThanOrEqual(8);
    expect(spot.top).toBeLessThanOrEqual(68);
    expect(Math.hypot(spot.left - pointer.left, spot.top - pointer.top)).toBeGreaterThan(20);
  }
});

test("when no spot is far enough, it takes the farthest one it found", () => {
  const near = sequence([0.8, 0.8, 0.85, 0.85]);
  const spot = fleeSpot({ left: 58, top: 56 }, { left: 60, top: 58 }, near);
  expect(spot.left).toBeCloseTo(4 + 0.8 * 68);
});

test("it leaves the frame by the side opposite the pointer", () => {
  expect(exitSpot({ left: 40, top: 30 }, { left: 20, top: 30 })).toEqual({ left: 115, top: 30 });
  expect(exitSpot({ left: 40, top: 30 }, { left: 70, top: 30 }).left).toBeLessThan(-20);
});

test("a longer run takes longer, within bounds", () => {
  const here = { left: 10, top: 10 };
  expect(runSeconds(here, { left: 12, top: 10 })).toBe(0.3);
  expect(runSeconds(here, { left: 70, top: 60 })).toBe(0.9);
  expect(runSeconds(here, { left: 40, top: 10 })).toBeCloseTo(0.4);
});
