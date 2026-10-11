import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { fetchHomeRecommendations } from "../lib/api-recommendations";
import { mapVideoItem } from "../lib/mappers";
import type { HomeRecommendationsResponse, VideoItem } from "../types/api";
import type { GalleryItem } from "./gallery-store";

const HOME_KEY = ["home-recommendations"];
const GALLERY_SIZE = 30;

function cachedVideos(client: QueryClient): VideoItem[] {
  return client
    .getQueriesData<InfiniteData<HomeRecommendationsResponse>>({ queryKey: HOME_KEY })
    .flatMap(([, data]) => data?.pages ?? [])
    .flatMap((page) => page.items);
}

async function freshVideos(service: number): Promise<VideoItem[]> {
  try {
    return (await fetchHomeRecommendations(service, GALLERY_SIZE)).items;
  } catch {
    return [];
  }
}

export async function loadGallery(client: QueryClient, service: number): Promise<GalleryItem[]> {
  const cached = cachedVideos(client);
  const videos = cached.length > 0 ? cached : await freshVideos(service);
  const items = new Map<string, GalleryItem>();
  for (const video of videos.map(mapVideoItem)) {
    if (!video.thumbnail || items.has(video.id)) continue;
    items.set(video.id, {
      key: video.id,
      title: video.title,
      channelName: video.channelName,
      thumbnail: video.thumbnail,
    });
  }
  return [...items.values()];
}
