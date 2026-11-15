import { expect, test } from "bun:test";
import type { TypeTypeMsePlayer } from "@typetype/mse";
import {
  runSabrSeek,
  secondsFromMediaSliderPercent,
  secondsFromSliderPercent,
} from "../src/lib/sabr-player-seek";

test("converts vidstack slider percentages to media seconds", () => {
  expect(secondsFromSliderPercent(3_554.534, 44)).toBeCloseTo(1_563.99496);
  expect(secondsFromSliderPercent(3_554.534, -1)).toBe(0);
  expect(secondsFromSliderPercent(3_554.534, 101)).toBe(3_554.534);
  expect(secondsFromSliderPercent(Number.NaN, 44)).toBeNull();
});

test("maps live slider percentages onto the native MSE seekable window", () => {
  const media = {
    duration: Number.POSITIVE_INFINITY,
    seekable: {
      length: 1,
      start: () => 3_600,
      end: () => 3_720,
    },
  };

  expect(secondsFromMediaSliderPercent(media, 0)).toBe(3_600);
  expect(secondsFromMediaSliderPercent(media, 50)).toBe(3_660);
  expect(secondsFromMediaSliderPercent(media, 100)).toBe(3_720);
});

test("falls back to duration when the media has no native seekable window", () => {
  const media = {
    duration: 600,
    seekable: {
      length: 0,
      start: () => 0,
      end: () => 0,
    },
  };

  expect(secondsFromMediaSliderPercent(media, 25)).toBe(150);
});

test("forwards repeated SABR seeks immediately and tracks only the latest", async () => {
  const finishSeeks: Array<() => void> = [];
  const positions: number[] = [];
  const states: boolean[] = [];
  const player = {
    seek: (position: number) => {
      positions.push(position);
      return new Promise<void>((resolve) => {
        finishSeeks.push(resolve);
      });
    },
  } as TypeTypeMsePlayer;
  const flag = { current: false };

  runSabrSeek(
    player,
    60_000,
    flag,
    () => undefined,
    (state) => states.push(state),
  );
  runSabrSeek(
    player,
    120_000,
    flag,
    () => undefined,
    (state) => states.push(state),
  );

  expect(positions).toEqual([60_000, 120_000]);
  expect(flag.current).toBe(true);
  expect(states).toEqual([true]);

  finishSeeks.shift()?.();
  await Promise.resolve();
  await Promise.resolve();

  expect(positions).toEqual([60_000, 120_000]);
  expect(flag.current).toBe(true);
  expect(states).toEqual([true]);

  finishSeeks.shift()?.();
  await Promise.resolve();
  await Promise.resolve();

  expect(flag.current).toBe(false);
  expect(states).toEqual([true, false]);
});

test("keeps seeking active across async seek recovery until the seek settles", async () => {
  let resolveRecovery: (() => void) | null = null;
  const reportedErrors: unknown[] = [];
  const states: boolean[] = [];
  const flag = { current: false };
  const player = {
    seek: () =>
      new Promise<void>((resolve) => {
        resolveRecovery = resolve;
      }),
  } as TypeTypeMsePlayer;

  runSabrSeek(
    player,
    86_399,
    flag,
    (error) => reportedErrors.push(error),
    (state) => states.push(state),
  );

  expect(flag.current).toBe(true);
  expect(states).toEqual([true]);

  resolveRecovery?.();
  await Promise.resolve();
  await Promise.resolve();

  expect(flag.current).toBe(false);
  expect(states).toEqual([true, false]);
  expect(reportedErrors).toEqual([]);
});

test("forwards the latest seek failure to onError and drops superseded failures", async () => {
  const rejectSeeks: Array<(error: unknown) => void> = [];
  const reportedErrors: unknown[] = [];
  const states: boolean[] = [];
  const flag = { current: false };
  const player = {
    seek: () =>
      new Promise<void>((_resolve, reject) => {
        rejectSeeks.push(reject);
      }),
  } as TypeTypeMsePlayer;

  runSabrSeek(
    player,
    60_000,
    flag,
    (error) => reportedErrors.push(error),
    (state) => states.push(state),
  );
  runSabrSeek(
    player,
    86_399,
    flag,
    (error) => reportedErrors.push(error),
    (state) => states.push(state),
  );

  rejectSeeks.shift()?.(new Error("superseded seek failure"));
  await Promise.resolve();
  await Promise.resolve();

  expect(reportedErrors).toEqual([]);
  expect(flag.current).toBe(true);

  const finalError = new Error("latest seek failure");
  rejectSeeks.shift()?.(finalError);
  await Promise.resolve();
  await Promise.resolve();

  expect(reportedErrors).toEqual([finalError]);
  expect(flag.current).toBe(false);
  expect(states).toEqual([true, false]);
});
