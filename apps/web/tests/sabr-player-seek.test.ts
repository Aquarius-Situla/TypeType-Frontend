import { expect, test } from "bun:test";
import type { TypeTypeMsePlayer } from "@typetype/mse";
import {
  isMediaTimeBuffered,
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

test("isMediaTimeBuffered detects whether timestamp is within buffered ranges", () => {
  expect(isMediaTimeBuffered(null, 10)).toBe(false);
  const emptyMedia = { buffered: { length: 0, start: () => 0, end: () => 0 } };
  expect(isMediaTimeBuffered(emptyMedia, 10)).toBe(false);

  const media = {
    buffered: {
      length: 1,
      start: () => 5,
      end: () => 20,
    },
  };

  expect(isMediaTimeBuffered(media, 4.9)).toBe(false);
  expect(isMediaTimeBuffered(media, 5.0)).toBe(true);
  expect(isMediaTimeBuffered(media, 10.0)).toBe(true);
  expect(isMediaTimeBuffered(media, 19.7)).toBe(true);
  // Default margin is 0.25s, so 19.8s > (20 - 0.25 = 19.75) is not safe
  expect(isMediaTimeBuffered(media, 19.8)).toBe(false);
  expect(isMediaTimeBuffered(media, 25.0)).toBe(false);
});

test("runSabrSeek with quiet option executes seek without toggling seeking state", async () => {
  const positions: number[] = [];
  const states: boolean[] = [];
  const player = {
    seek: (position: number) => {
      positions.push(position);
      return Promise.resolve();
    },
  } as TypeTypeMsePlayer;
  const flag = { current: false };

  runSabrSeek(
    player,
    30_000,
    flag,
    () => undefined,
    (state) => states.push(state),
    { quiet: true },
  );

  expect(positions).toEqual([30_000]);
  expect(flag.current).toBe(false);
  expect(states).toEqual([]);

  await Promise.resolve();
  expect(flag.current).toBe(false);
  expect(states).toEqual([]);
});
