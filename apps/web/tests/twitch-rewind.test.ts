import { expect, test } from "bun:test";
import {
  REWIND_MIN_BEHIND_MS,
  rewindRangeMs,
  rewindSliderValue,
  rewindTarget,
} from "../src/lib/twitch-rewind";

test("the slider spans the recording up to the live edge", () => {
  expect(rewindRangeMs("2026-11-17T18:00:00Z", Date.parse("2026-11-17T18:10:00Z"))).toBe(
    600_000 - 15_000,
  );
  expect(rewindRangeMs("bad", Date.now())).toBe(0);
});

test("releasing near the live edge stays live, further back opens the past broadcast", () => {
  const range = 600_000;
  expect(rewindTarget(range, range)).toBeNull();
  expect(rewindTarget(range - REWIND_MIN_BEHIND_MS + 1, range)).toBeNull();
  expect(rewindTarget(range - REWIND_MIN_BEHIND_MS, range)).toBe(range - REWIND_MIN_BEHIND_MS);
  expect(rewindTarget(0, range)).toBe(0);
  expect(rewindTarget(10_000, 0)).toBeNull();
});

test("the slider follows the live, the recording position, then the drag", () => {
  expect(rewindSliderValue(null, false, 5_000, 600_000)).toBe(600_000);
  expect(rewindSliderValue(null, true, 5_000, 600_000)).toBe(5_000);
  expect(rewindSliderValue(null, true, 700_000, 600_000)).toBe(600_000);
  expect(rewindSliderValue(42_000, true, 5_000, 600_000)).toBe(42_000);
});
