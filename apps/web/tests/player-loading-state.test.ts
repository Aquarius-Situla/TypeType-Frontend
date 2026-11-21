import { expect, test } from "bun:test";
import { isPlayerStartingLoading } from "../src/lib/player-loading-state";

test("isPlayerStartingLoading is true only before first frame when playing or autoplaying", () => {
  expect(
    isPlayerStartingLoading({
      started: false,
      paused: true,
      autoplaying: false,
      autoplay: true,
    }),
  ).toBe(true);
  expect(
    isPlayerStartingLoading({
      started: true,
      paused: false,
      autoplaying: true,
      autoplay: true,
    }),
  ).toBe(false);
});
