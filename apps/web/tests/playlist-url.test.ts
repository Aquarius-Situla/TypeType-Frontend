import { expect, test } from "bun:test";
import { playlistPath, playlistSearch, youtubePlaylistId } from "../src/lib/playlist-url";

const LIST = "PL4EBEsF92mtlXM0JjGUkxYTUZHP34ZRqn";

test("links a YouTube playlist by its list id", () => {
  expect(playlistSearch(`https://www.youtube.com/playlist?list=${LIST}`)).toEqual({
    list: LIST,
    url: undefined,
  });
  expect(youtubePlaylistId(`https://music.youtube.com/playlist?list=${LIST}`)).toBe(LIST);
});

test("keeps the full url for other playlists", () => {
  const bilibili = "https://space.bilibili.com/1/lists/2?type=season";
  expect(playlistSearch(bilibili)).toEqual({ list: undefined, url: bilibili });
  expect(youtubePlaylistId(`https://www.youtube.com/watch?v=a&list=${LIST}`)).toBeNull();
  expect(youtubePlaylistId(`https://example.com/playlist?list=${LIST}`)).toBeNull();
  expect(youtubePlaylistId("not a url")).toBeNull();
});

test("shows the clean playlist path", () => {
  expect(playlistPath(`https://www.youtube.com/playlist?list=${LIST}`)).toBe(
    `/playlist?list=${LIST}`,
  );
  expect(playlistPath("https://space.bilibili.com/1/lists/2")).toBe(
    "/playlist?url=https%3A%2F%2Fspace.bilibili.com%2F1%2Flists%2F2",
  );
});
