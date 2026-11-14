import { expect, test } from "bun:test";
import {
  isBilibiliSeriesPlaylist,
  playlistPath,
  playlistSearch,
  resolvePublicPlaylistWatchListId,
  youtubePlaylistId,
} from "../src/lib/playlist-url";

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

test("omits watch listId for Bilibili series so watch uses native collections or parts", () => {
  const seriesUrl =
    "https://www.bilibili.com/medialist/play/1526560679?business=space_series&business_id=1916889&name=%E5%9F%BA%E7%A1%80%E5%A4%A7%E5%90%88%E9%9B%86";
  const seriesDetailUrl = "https://space.bilibili.com/1526560679/channel/seriesdetail?sid=1916889";

  expect(isBilibiliSeriesPlaylist(seriesUrl)).toBe(true);
  expect(isBilibiliSeriesPlaylist(seriesDetailUrl)).toBe(true);
  expect(isBilibiliSeriesPlaylist("series:1526560679:1916889")).toBe(true);
  expect(isBilibiliSeriesPlaylist("bilibili:series:1526560679:1916889")).toBe(true);
  expect(isBilibiliSeriesPlaylist("https://www.bilibili.com/list/1526560679", "series")).toBe(true);

  expect(resolvePublicPlaylistWatchListId(seriesUrl, seriesUrl)).toBeUndefined();
  expect(resolvePublicPlaylistWatchListId(seriesDetailUrl, seriesDetailUrl)).toBeUndefined();
  expect(
    resolvePublicPlaylistWatchListId("https://example.com/p", "list-1", "series"),
  ).toBeUndefined();
});

test("preserves watch listId for Bilibili collections and YouTube playlists", () => {
  const collectionUrl =
    "https://www.bilibili.com/medialist/play/23630128?business=space_collection&business_id=2181";
  const collectionDetailUrl =
    "https://space.bilibili.com/23630128/channel/collectiondetail?sid=2181";

  expect(isBilibiliSeriesPlaylist(collectionUrl, "collection")).toBe(false);
  expect(isBilibiliSeriesPlaylist(collectionDetailUrl)).toBe(false);
  expect(isBilibiliSeriesPlaylist("season:23630128:2181")).toBe(false);
  expect(isBilibiliSeriesPlaylist(`https://www.youtube.com/playlist?list=${LIST}`)).toBe(false);

  expect(resolvePublicPlaylistWatchListId(collectionUrl, collectionUrl, "collection")).toBe(
    collectionUrl,
  );
  expect(
    resolvePublicPlaylistWatchListId(`https://www.youtube.com/playlist?list=${LIST}`, LIST),
  ).toBe(LIST);
});
