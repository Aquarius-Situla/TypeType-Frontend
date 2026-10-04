import type { WatchPlaylistItem } from "../types/playlist";
import type { StreamCollectionItem } from "../types/stream-collection";
import { proxyImage } from "./proxy";
import { toPublicWatchParam } from "./watch-url";

export function streamCollectionPlaylistItems(
  collection: StreamCollectionItem | undefined,
): WatchPlaylistItem[] {
  if (!collection) return [];

  const seen = new Set<string>();
  const items: WatchPlaylistItem[] = [];
  for (const section of collection.sections) {
    for (const episode of section.episodes) {
      const url = episode.url.trim();
      if (!url || seen.has(url)) continue;
      seen.add(url);
      items.push({
        key: episode.videoId || url,
        url,
        title: episode.title,
        thumbnail: proxyImage(episode.thumbnailUrl),
      });
    }
  }
  return items;
}

export type StreamCollectionSectionGroup = {
  id: string;
  title: string;
  videos: WatchPlaylistItem[];
};

export function streamCollectionSectionGroups(
  collection: StreamCollectionItem | undefined,
): StreamCollectionSectionGroup[] {
  if (!collection) return [];

  return collection.sections
    .map((section) => ({
      id: section.id,
      title: section.title,
      videos: section.episodes
        .map((episode) => {
          const url = episode.url.trim();
          if (!url) return null;
          return {
            key: episode.videoId || url,
            url,
            title: episode.title,
            thumbnail: proxyImage(episode.thumbnailUrl),
          };
        })
        .filter((item): item is WatchPlaylistItem => item !== null),
    }))
    .filter((group) => group.videos.length > 0);
}

export function activeStreamCollection(
  collections: StreamCollectionItem[] | undefined,
  currentParam: string,
): StreamCollectionItem | undefined {
  if (!collections?.length) return undefined;
  const nonEmpty = collections.filter(
    (collection) => streamCollectionPlaylistItems(collection).length > 0,
  );
  return (
    nonEmpty.find((collection) =>
      streamCollectionPlaylistItems(collection).some(
        (item) => toPublicWatchParam(item.url) === currentParam,
      ),
    ) ?? nonEmpty[0]
  );
}
