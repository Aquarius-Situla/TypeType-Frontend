import { expect, test } from "bun:test";
import { resolveWatchStartTime, shouldWaitForWatchProgress } from "../src/lib/watch-resume";

test("does not block a cached progress value during refresh", () => {
  expect(shouldWaitForWatchProgress(true, false, true, false)).toBe(true);
  expect(shouldWaitForWatchProgress(true, false, true, true)).toBe(false);
  expect(shouldWaitForWatchProgress(true, false, false, false)).toBe(false);
  expect(shouldWaitForWatchProgress(false, false, true, false)).toBe(false);
});

test("waits for authenticated progress before choosing the initial position", () => {
  expect(
    resolveWatchStartTime({
      authenticated: true,
      progressPending: true,
      durationSeconds: 600,
    }),
  ).toBeNull();
});

test("uses saved progress once it is available", () => {
  expect(
    resolveWatchStartTime({
      authenticated: true,
      progressPending: false,
      savedPositionMs: 125_000,
      serverPositionSeconds: 40,
      durationSeconds: 600,
    }),
  ).toBe(125_000);
});

test("does not delay guests and rejects positions too close to the end", () => {
  expect(
    resolveWatchStartTime({
      authenticated: false,
      progressPending: true,
      serverPositionSeconds: 40,
      durationSeconds: 600,
    }),
  ).toBe(40_000);
  expect(
    resolveWatchStartTime({
      authenticated: true,
      progressPending: false,
      savedPositionMs: 580_000,
      durationSeconds: 600,
    }),
  ).toBe(0);
  expect(
    resolveWatchStartTime({
      authenticated: true,
      progressPending: false,
      savedPositionMs: 600_000,
      durationSeconds: 600,
    }),
  ).toBe(0);
  expect(
    resolveWatchStartTime({
      authenticated: true,
      progressPending: false,
      savedPositionMs: 550_000,
      durationSeconds: 600,
    }),
  ).toBe(550_000);
});
