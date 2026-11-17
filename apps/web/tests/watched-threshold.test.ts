import { expect, test } from "bun:test";
import { shouldKeepPersistentPlayerForRoute } from "../src/lib/persistent-player-navigation";
import { isVideoInProgress, isVideoWatched } from "../src/lib/watch-progress";

test("the default rule counts the last minute as watched", () => {
  expect(isVideoWatched(540, 600)).toBe(true);
  expect(isVideoWatched(530, 600)).toBe(false);
  expect(isVideoWatched(27, 30)).toBe(true);
});

test("a watched threshold counts a share of the video", () => {
  expect(isVideoWatched(480, 600, 80)).toBe(true);
  expect(isVideoWatched(479, 600, 80)).toBe(false);
  expect(isVideoWatched(599, 600, 100)).toBe(false);
  expect(isVideoInProgress(300, 600, 50)).toBe(false);
  expect(isVideoInProgress(299, 600, 50)).toBe(true);
});

test("thresholds outside 50 to 100 keep the default rule", () => {
  expect(isVideoWatched(300, 600, 30)).toBe(false);
  expect(isVideoWatched(540, 600, 120)).toBe(true);
});

test("a disabled mini player closes the player outside the watch page", () => {
  expect(
    shouldKeepPersistentPlayerForRoute("https://www.youtube.com/watch?v=abc", "/", false),
  ).toBe(false);
  expect(shouldKeepPersistentPlayerForRoute("https://www.youtube.com/watch?v=abc", "/", true)).toBe(
    true,
  );
});
