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

test("isSeekSettled checks within 2.5s tolerance once playback has started or seek reached target", () => {
  // Once currentTime > 0:
  expect(isSeekSettled(1.4, 1.5)).toBe(true);
  expect(isSeekSettled(1.5, 1.5)).toBe(true);
  expect(isSeekSettled(4.0, 1.5)).toBe(true);
  expect(isSeekSettled(4.1, 1.5)).toBe(false);

  expect(isSeekSettled(59.5, 60)).toBe(true);
  expect(isSeekSettled(62.0, 60)).toBe(true);
  expect(isSeekSettled(63.0, 60)).toBe(false);
});
