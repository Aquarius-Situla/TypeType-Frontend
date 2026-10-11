import { expect, mock, test } from "bun:test";
import { type InfiniteData, QueryClient } from "@tanstack/react-query";
import type { HomeRecommendationsResponse, VideoItem } from "../src/types/api";

const fetchHomeRecommendations = mock(
  async (service: number): Promise<HomeRecommendationsResponse> => ({
    items: [video(`fetched-${service}`)],
    nextCursor: null,
    hasMore: false,
  }),
);

mock.module("../src/lib/api-recommendations", () => ({
  fetchHomeRecommendations,
}));

const { loadGallery } = await import("../src/halloween/gallery-source");

test("does not read or fetch recommendations when hidden", async () => {
  const client = new QueryClient();
  cacheVideos(client, 1, "cached");
  fetchHomeRecommendations.mockClear();

  expect(await loadGallery(client, 1, true)).toEqual([]);
  expect(fetchHomeRecommendations).not.toHaveBeenCalled();
  client.clear();
});

test("uses only recommendations for the selected service", async () => {
  const client = new QueryClient();
  cacheVideos(client, 1, "selected");
  cacheVideos(client, 2, "other");
  fetchHomeRecommendations.mockClear();

  expect((await loadGallery(client, 1, false)).map((item) => item.title)).toEqual(["selected"]);
  expect(fetchHomeRecommendations).not.toHaveBeenCalled();
  client.clear();
});

test("fetches the selected service when only another service is cached", async () => {
  const client = new QueryClient();
  cacheVideos(client, 2, "other");
  fetchHomeRecommendations.mockClear();

  expect((await loadGallery(client, 1, false)).map((item) => item.title)).toEqual(["fetched-1"]);
  expect(fetchHomeRecommendations).toHaveBeenCalledWith(1, 30);
  client.clear();
});

function cacheVideos(client: QueryClient, service: number, id: string): void {
  client.setQueryData<InfiniteData<HomeRecommendationsResponse>>(
    ["home-recommendations", "v2", service, "auto"],
    {
      pages: [{ items: [video(id)], nextCursor: null, hasMore: false }],
      pageParams: [undefined],
    },
  );
}

function video(id: string): VideoItem {
  return {
    id,
    title: id,
    url: `https://www.youtube.com/watch?v=${id}`,
    thumbnailUrl: "https://example.com/thumbnail.jpg",
    uploaderName: "channel",
    uploaderUrl: "",
    uploaderAvatarUrl: "",
    uploaderVerified: false,
    duration: 60,
    viewCount: 0,
    uploadDate: "",
    uploaded: 0,
    streamType: "",
    isLive: false,
    isPostLive: false,
    isLiveContent: false,
    requiresMembership: false,
    isShortFormContent: false,
    shortDescription: null,
  };
}
