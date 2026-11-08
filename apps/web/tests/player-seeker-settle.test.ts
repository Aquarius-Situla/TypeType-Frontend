import { expect, test } from "bun:test";
import { isSeekSettled } from "../src/lib/player-seeker-settle";

test("isSeekSettled correctly handles zero currentTime and small targets", () => {
  // When currentTime is 0, only targets <= 0.3s are considered settled
  expect(isSeekSettled(0, 0.2)).toBe(true);
  expect(isSeekSettled(0, 0.3)).toBe(true);
  expect(isSeekSettled(0, 0.5)).toBe(false);
  expect(isSeekSettled(0, 1.5)).toBe(false);
  expect(isSeekSettled(0, 2.5)).toBe(false);
  expect(isSeekSettled(0, 60)).toBe(false);
});

test("isSeekSettled checks within keyframe tolerance once playback has started or seek reached target", () => {
  // Keyframe / GOP tolerance test
  expect(isSeekSettled(1.4, 1.5)).toBe(true);
  expect(isSeekSettled(1.5, 1.5)).toBe(true);
  expect(isSeekSettled(3.0, 1.5)).toBe(true);
  expect(isSeekSettled(4.0, 1.5)).toBe(false);

  // Target 60s: accepts a few seconds before on keyframe (<= 5s) and up to 2s after
  expect(isSeekSettled(55.0, 60)).toBe(true);
  expect(isSeekSettled(54.9, 60)).toBe(false);
  expect(isSeekSettled(59.5, 60)).toBe(true);
  expect(isSeekSettled(60.0, 60)).toBe(true);
  expect(isSeekSettled(61.5, 60)).toBe(true);
  expect(isSeekSettled(62.0, 60)).toBe(true);
  expect(isSeekSettled(62.5, 60)).toBe(false);
  expect(isSeekSettled(75.0, 60)).toBe(false);

  // Target 772.5s (Bilibili BV1NS4t6oEXQ keyframe at 767.88s, 4.62s before target)
  expect(isSeekSettled(767.88, 772.5)).toBe(true);
  expect(isSeekSettled(766.0, 772.5)).toBe(false);
});
