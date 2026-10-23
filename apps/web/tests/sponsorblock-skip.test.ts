import { expect, test } from "bun:test";
import {
  crossedSponsorBlockStart,
  isSponsorBlockEndSkip,
  sponsorBlockSkipTarget,
} from "../src/lib/sponsorblock-skip";

test("waits for playback before skipping a segment at the beginning", () => {
  expect(crossedSponsorBlockStart(null, 0, 0)).toBeFalse();
  expect(crossedSponsorBlockStart(0, 0, 0)).toBeFalse();
  expect(crossedSponsorBlockStart(0, 0.2, 0)).toBeTrue();
});

test("skips only while crossing a later segment start", () => {
  expect(crossedSponsorBlockStart(101.9, 102.2, 102.112)).toBeTrue();
  expect(crossedSponsorBlockStart(101.9, 101.95, 102.112)).toBeFalse();
  expect(crossedSponsorBlockStart(110, 110.2, 102.112)).toBeFalse();
});

test("does not trigger auto-skip on large seek jumps", () => {
  // Seek from 0 to 57304s (15.9 hours) over a sponsor block at 1.151s
  expect(crossedSponsorBlockStart(0, 57304, 1.151)).toBeFalse();
  // Seek from 100s to 500s over a sponsor block at 150s
  expect(crossedSponsorBlockStart(100, 500, 150)).toBeFalse();
});

test("correctly calculates skip target and end skip", () => {
  // Normal skip
  expect(sponsorBlockSkipTarget(30, 100)).toBe(30);
  // End skip within threshold
  expect(isSponsorBlockEndSkip(99.5, 100)).toBeTrue();
  expect(sponsorBlockSkipTarget(99.5, 100)).toBe(99.65);
  // Troll endTime far beyond duration
  expect(isSponsorBlockEndSkip(76858450, 365142)).toBeFalse();
  expect(sponsorBlockSkipTarget(76858450, 365142)).toBe(365141);
});
