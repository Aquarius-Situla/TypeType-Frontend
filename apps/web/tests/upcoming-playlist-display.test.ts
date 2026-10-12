import { expect, test } from "bun:test";
import { upcomingPlaylistDisplay } from "../src/lib/upcoming-playlist-display";
import type { WatchPlaylistItem } from "../src/types/playlist";

const video: WatchPlaylistItem = {
  key: "a",
  url: "https://www.youtube.com/watch?v=a",
  title: "Song A",
  thumbnail: "https://i.ytimg.com/vi/a/hq720.jpg",
  channelName: "Artist",
  channelUrl: "https://www.youtube.com/@artist",
};

test("shows the next playlist title when hiding is off", () => {
  const display = upcomingPlaylistDisplay(video, false);
  expect(display.title).toBe("Song A");
  expect(display.thumbnail).toBe("https://i.ytimg.com/vi/a/hq720.jpg");
  expect(display.channelName).toBe("Artist");
  expect(display.hidden).toBe(false);
});

test("drops title, thumbnail and channel when hiding is on", () => {
  const display = upcomingPlaylistDisplay(video, true);
  expect(display).toEqual({ title: "", thumbnail: "", channelName: "", hidden: true });
});

test("never leaks a loaded video when the next item is unknown", () => {
  expect(upcomingPlaylistDisplay(undefined, true).title).toBe("");
  expect(upcomingPlaylistDisplay(null, false).title.length).toBeGreaterThan(0);
});
