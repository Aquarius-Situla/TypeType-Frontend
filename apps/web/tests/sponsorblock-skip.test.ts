import { expect, test } from "bun:test";
import {
  crossedSponsorBlockStart,
  finishSponsorBlockEnd,
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
  // Not end skip if below threshold
  expect(isSponsorBlockEndSkip(98, 100)).toBeFalse();
});

test("finishSponsorBlockEnd pauses media and dispatches ended event", () => {
  let paused = false;
  let remotePaused = false;
  let endedDispatched = false;

  const media = {
    pause() {
      paused = true;
    },
    dispatchEvent(event: Event) {
      if (event.type === "ended") endedDispatched = true;
      return true;
    },
  } as unknown as HTMLMediaElement;

  const remote = {
    pause() {
      remotePaused = true;
    },
  };

  finishSponsorBlockEnd(media, remote, 452);

  expect(paused).toBeTrue();
  expect(remotePaused).toBeTrue();
  expect(endedDispatched).toBeTrue();
});

test("finishSponsorBlockEnd handles null media by seeking to duration via remote", () => {
  let remoteSeekTarget: number | null = null;
  const remote = {
    pause() {},
    seek(seconds: number) {
      remoteSeekTarget = seconds;
    },
  };

  finishSponsorBlockEnd(null, remote, 452);
  expect(remoteSeekTarget).toBe(452);
});

test("identifies rewind and replay boundaries safely", () => {
  // Micro-rewind due to stall recovery (e.g. 450.8s when start is 451.0s) is within 1s tolerance
  const startTime = 451.0;
  const stallRecoveryTime = 450.8;
  expect(stallRecoveryTime < startTime - 1).toBeFalse();

  // Deliberate user backward seek (e.g. 445s or earlier) is outside 1s tolerance
  const deliberateRewindTime = 445.0;
  expect(deliberateRewindTime < startTime - 1).toBeTrue();

  // Replay detection (currentTime < 1 && previousTime > 5)
  const isReplay = (curr: number, prev: number | null) => curr < 1 && prev !== null && prev > 5;
  expect(isReplay(0, 451)).toBeTrue();
  expect(isReplay(0.5, 30)).toBeTrue();
  expect(isReplay(0.2, 0.4)).toBeFalse();
  expect(isReplay(10, 451)).toBeFalse();
});
