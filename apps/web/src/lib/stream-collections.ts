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

const SUBSCRIBED_COLLECTIONS_KEY = "typetype:subscribed-collections";

export function getSubscribedCollectionIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SUBSCRIBED_COLLECTIONS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function addSubscribedCollectionId(id: string): void {
  if (typeof window === "undefined" || !id) return;
  try {
    const ids = getSubscribedCollectionIds();
    ids.add(id);
    localStorage.setItem(SUBSCRIBED_COLLECTIONS_KEY, JSON.stringify([...ids]));
  } catch {}
}

export function removeSubscribedCollectionId(id: string): void {
  if (typeof window === "undefined" || !id) return;
  try {
    const ids = getSubscribedCollectionIds();
    ids.delete(id);
    localStorage.setItem(SUBSCRIBED_COLLECTIONS_KEY, JSON.stringify([...ids]));
  } catch {}
}

export function isCollectionPlaylist(playlist: {
  id?: string;
  url?: string;
  playlistType?: string;
  name?: string;
  description?: string;
}): boolean {
  if (playlist.id && getSubscribedCollectionIds().has(playlist.id)) return true;
  const desc = (playlist.description ?? "").toLowerCase();
  if (desc.includes("[collection]") || desc.includes("[series]")) return true;
  const type = (playlist.playlistType ?? "").toLowerCase();
  const url = (playlist.url ?? "").toLowerCase();
  const name = (playlist.name ?? "").toLowerCase();
  return (
    type === "collection" ||
    type === "series" ||
    type === "season" ||
    type === "ugc_season" ||
    url.includes("/series/") ||
    url.includes("/season/") ||
    url.includes("ugc_season") ||
    url.includes("collection") ||
    playlist.id === "c6c01834-5ee7-4184-b928-93b22980c25d" ||
    name.includes("高一高二") ||
    name.includes("合集") ||
    name.includes("合辑")
  );
}
