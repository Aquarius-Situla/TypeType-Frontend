import { expect, test } from "bun:test";
import { shouldKeepPersistentPlayerForRoute } from "../src/lib/persistent-player-navigation";

test("keeps the persistent player when returning to its video", () => {
  expect(
    shouldKeepPersistentPlayerForRoute(
      "https://www.youtube.com/watch?v=abcdefghijk",
      "/watch?v=abcdefghijk&list=playlist",
    ),
  ).toBe(true);
});

test("destroys a persistent player when another watch video is opened", () => {
  expect(
    shouldKeepPersistentPlayerForRoute(
      "https://www.youtube.com/watch?v=abcdefghijk",
      "/watch?v=lmnopqrstuv",
    ),
  ).toBe(false);
});

test("keeps the mini-player on non-watch routes", () => {
  expect(shouldKeepPersistentPlayerForRoute("stream-1", "/search?q=live")).toBe(true);
});

test("keeps a Twitch live floating on other pages and docks it back on its own page", () => {
  expect(shouldKeepPersistentPlayerForRoute("twitch:live:somechannel", "/twitch")).toBe(true);
  expect(
    shouldKeepPersistentPlayerForRoute("twitch:live:somechannel", "/twitch/watch?c=SomeChannel"),
  ).toBe(true);
});

test("replaces a Twitch player when another Twitch or YouTube video opens", () => {
  expect(
    shouldKeepPersistentPlayerForRoute("twitch:live:somechannel", "/twitch/watch?c=other"),
  ).toBe(false);
  expect(
    shouldKeepPersistentPlayerForRoute("twitch:live:somechannel", "/watch?v=abcdefghijk"),
  ).toBe(false);
  expect(
    shouldKeepPersistentPlayerForRoute(
      "https://www.youtube.com/watch?v=abcdefghijk",
      "/twitch/watch?c=x",
    ),
  ).toBe(false);
});

test("matches Twitch ids the router serialised as JSON strings", () => {
  expect(
    shouldKeepPersistentPlayerForRoute(
      "twitch:video:2929121489",
      "/twitch/watch?v=%222929121489%22",
    ),
  ).toBe(true);
  expect(
    shouldKeepPersistentPlayerForRoute("twitch:video:2929121489", "/twitch/watch?v=2929121489"),
  ).toBe(true);
});
