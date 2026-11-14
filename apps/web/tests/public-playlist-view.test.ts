import { expect, test } from "bun:test";
import {
  isPublicBilibiliCollection,
  resolvePublicPlaylistStreams,
} from "../src/lib/public-playlist-view";
import type { SubscribedCollectionSectionMeta } from "../src/lib/stream-collections";
import type { PublicPlaylistInfo } from "../src/types/playlist";
import type { VideoStream } from "../src/types/stream";

const makeStream = (id: string, title: string, duration = 120): VideoStream => ({
  id,
  title,
  thumbnail: "https://example.com/thumb.jpg",
  rawThumbnail: "https://example.com/thumb.jpg",
  rawChannelAvatar: "https://example.com/avatar.jpg",
  channelName: "Uploader",
  channelUrl: "https://space.bilibili.com/123",
  channelAvatar: "https://example.com/avatar.jpg",
  views: 1000,
  duration,
});

const info: PublicPlaylistInfo = {
  id: "https://www.bilibili.com/medialist/play/123?business=space_collection&business_id=456",
  title: "Test Collection",
  url: "https://www.bilibili.com/medialist/play/123?business=space_collection&business_id=456",
  thumbnailUrl: "",
  uploaderName: "Uploader",
  streamCount: 3,
  playlistType: "collection",
};

test("isPublicBilibiliCollection does not match non-Bilibili playlists even with合集 in title", () => {
  expect(isPublicBilibiliCollection("https://www.youtube.com/playlist?list=PL123", "normal")).toBe(
    false,
  );
  expect(
    isPublicBilibiliCollection(
      "https://www.bilibili.com/medialist/play/123?business=space_series&business_id=456",
      "series",
    ),
  ).toBe(false);
  expect(
    isPublicBilibiliCollection(
      "https://www.bilibili.com/medialist/play/123?business=space_collection&business_id=456",
    ),
  ).toBe(true);
  expect(isPublicBilibiliCollection("https://example.com/any", "ugc_season")).toBe(true);
});

test("resolvePublicPlaylistStreams keeps full loaded streams in All view and filters blocked items in sections", () => {
  const page1 = [makeStream("https://www.bilibili.com/video/BV1one", "Keep Video 1", 300)];

  const section: SubscribedCollectionSectionMeta = {
    id: "sec1",
    title: "Chapter 1",
    videoUrls: [
      "https://www.bilibili.com/video/BV1one",
      "https://www.bilibili.com/video/BV2blocked",
      "https://www.bilibili.com/video/BV3unloaded",
    ],
    episodes: [
      { videoId: "BV1one", title: "Keep Video 1", url: "https://www.bilibili.com/video/BV1one" },
      {
        videoId: "BV2blocked",
        title: "Blocked Keyword Video",
        url: "https://www.bilibili.com/video/BV2blocked",
      },
      {
        videoId: "BV3unloaded",
        title: "Unloaded Episode 3",
        url: "https://www.bilibili.com/video/BV3unloaded",
      },
    ],
  };

  const blockFilter = <T extends { title?: string }>(items: T[]) =>
    items.filter((item) => !item.title?.includes("Blocked"));

  // All view renders paginated streams with real duration/views
  const allView = resolvePublicPlaylistStreams({
    streams: page1,
    activeSection: undefined,
    info,
    filter: blockFilter,
  });
  expect(allView).toEqual(page1);
  expect(allView[0].duration).toBe(300);

  // Section view reuses loaded stream metadata where available, fills unloaded ones, and applies block filter
  const sectionView = resolvePublicPlaylistStreams({
    streams: page1,
    activeSection: section,
    info,
    filter: blockFilter,
  });
  expect(sectionView).toHaveLength(2);
  expect(sectionView[0].id).toBe("https://www.bilibili.com/video/BV1one");
  expect(sectionView[0].duration).toBe(300);
  expect(sectionView[1].id).toBe("https://www.bilibili.com/video/BV3unloaded");
  expect(sectionView[1].channelName).toBe("Uploader");
});
