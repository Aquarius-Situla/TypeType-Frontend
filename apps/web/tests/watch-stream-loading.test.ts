import { expect, test } from "bun:test";
import {
  isWatchStreamPending,
  shouldLoadFullWatchStream,
  shouldLoadSabrBootstrap,
} from "../src/lib/watch-stream-loading";

test("loads the full stream in parallel with bootstrap", () => {
  expect(shouldLoadFullWatchStream(true)).toBe(true);
});

test("loads non-YouTube streams without waiting for SABR bootstrap", () => {
  expect(shouldLoadFullWatchStream(true)).toBe(true);
});

test("keeps all stream requests disabled until watch access is ready", () => {
  expect(shouldLoadFullWatchStream(false)).toBe(false);
});

test("skips the SABR bootstrap when the navigation preview is a live stream", () => {
  expect(shouldLoadSabrBootstrap(true, true)).toBe(false);
});

test("keeps the SABR bootstrap for videos without a confirmed live preview", () => {
  expect(shouldLoadSabrBootstrap(true, false)).toBe(true);
});

test("keeps the SABR bootstrap disabled until watch access is ready", () => {
  expect(shouldLoadSabrBootstrap(false, false)).toBe(false);
});

test("keeps the loading screen while React Query holds the previous stream", () => {
  expect(isWatchStreamPending(false, false, true)).toBe(true);
});

test("does not keep loading once the current stream is ready", () => {
  expect(isWatchStreamPending(false, false, false)).toBe(false);
});
