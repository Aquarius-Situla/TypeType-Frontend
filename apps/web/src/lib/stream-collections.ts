import type { WatchPlaylistItem } from "../types/playlist";
import type { StreamCollectionItem } from "../types/stream-collection";
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
        thumbnail: "",
      });
    }
  }
  return items;
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
