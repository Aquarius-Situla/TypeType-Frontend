import { expect, test } from "bun:test";
import { resolvePlayerLoadingInput } from "../src/lib/player-loading-state";

test("shows starting mascot before first frame when autoplay or playing", () => {
  expect(
    resolvePlayerLoadingInput({
      started: false,
      paused: true,
      waiting: false,
      autoplaying: false,
      autoplay: true,
    }),
  ).toEqual({ starting: true, stalled: false });

  expect(
    resolvePlayerLoadingInput({
      started: false,
      paused: false,
      waiting: false,
      autoplaying: false,
      autoplay: false,
    }),
  ).toEqual({ starting: true, stalled: false });
});

test("keeps poster clickable before first frame when paused without autoplay", () => {
  expect(
    resolvePlayerLoadingInput({
      started: false,
      paused: true,
      waiting: false,
      autoplaying: false,
      autoplay: false,
    }),
  ).toEqual({ starting: false, stalled: false });
});

test("detects mid-playback stall only when started and waiting or seeking", () => {
  expect(
    resolvePlayerLoadingInput({
      started: true,
      paused: false,
      waiting: true,
      autoplaying: false,
      autoplay: false,
    }),
  ).toEqual({ starting: false, stalled: true });

  expect(
    resolvePlayerLoadingInput({
      started: true,
      paused: true,
      waiting: true,
      autoplaying: false,
      autoplay: false,
    }),
  ).toEqual({ starting: false, stalled: false });

  expect(
    resolvePlayerLoadingInput({
      started: true,
      paused: false,
      waiting: false,
      autoplaying: false,
      autoplay: false,
      seeking: true,
    }),
  ).toEqual({ starting: false, stalled: true });
});
