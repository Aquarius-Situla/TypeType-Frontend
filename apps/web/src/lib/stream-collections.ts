import type { WatchPlaylistItem } from "../types/playlist";
import type { StreamCollectionItem } from "../types/stream-collection";
import {
  isBilibiliSeriesUrl,
  parseBilibiliCollectionParams,
} from "./api-bilibili-channel-collections";
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

type SubscribedCollectionEpisodeMeta = {
  videoId?: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  channelName?: string;
};

export type SubscribedCollectionSectionMeta = {
  id: string;
  title: string;
  videoUrls: string[];
  episodes?: SubscribedCollectionEpisodeMeta[];
};

export type SubscribedCollectionMeta = {
  id: string;
  title: string;
  originalTitle?: string;
  sourceCollectionId?: string;
  sections?: SubscribedCollectionSectionMeta[];
};

const SUBSCRIBED_COLLECTIONS_KEY = "typetype:subscribed-collections";
const SUBSCRIBED_COLLECTIONS_META_KEY = "typetype:subscribed-collections-meta";

function getSubscribedCollectionIds(): Set<string> {
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

function getSubscribedCollectionsMeta(): Record<string, SubscribedCollectionMeta> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SUBSCRIBED_COLLECTIONS_META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveSubscribedCollectionMeta(meta: SubscribedCollectionMeta): void {
  if (typeof window === "undefined" || !meta.id) return;
  try {
    const all = getSubscribedCollectionsMeta();
    all[meta.id] = meta;
    localStorage.setItem(SUBSCRIBED_COLLECTIONS_META_KEY, JSON.stringify(all));
  } catch {}
}

export function getSubscribedCollectionMeta(id: string): SubscribedCollectionMeta | undefined {
  if (typeof window === "undefined" || !id) return undefined;
  return getSubscribedCollectionsMeta()[id];
}

const attemptedCountRefreshByPlaylist = new Map<string, number>();
const inFlightCollectionMetadata = new Map<string, Promise<SubscribedCollectionMeta | undefined>>();
const failedRefreshAtByPlaylist = new Map<string, number>();
const RETRY_AFTER_FAILURE_MS = 5 * 60_000;

export async function ensureCollectionMetadata(
  playlistId: string,
  playlistName: string,
  videos: { url?: string; id?: string; title?: string }[],
  expectedStreamCount?: number,
): Promise<SubscribedCollectionMeta | undefined> {
  if (isBilibiliSeriesUrl(playlistId)) {
    return undefined;
  }

  const existing = getSubscribedCollectionMeta(playlistId);
  const parsed = parseBilibiliCollectionParams(playlistId);
  const hasEpisodes = Boolean(
    existing?.sections?.every(
      (sec) => sec.videoUrls.length === 0 || (sec.episodes && sec.episodes.length > 0),
    ),
  );
  const cachedTotal =
    existing?.sections?.reduce((acc, s) => acc + (s.episodes?.length ?? s.videoUrls.length), 0) ??
    0;
  const streamCountMatches =
    !expectedStreamCount || expectedStreamCount <= 0 || cachedTotal === expectedStreamCount;
  const hasCachedSections = Boolean(
    existing?.sections &&
      existing.sections.length > 0 &&
      hasEpisodes &&
      (!parsed?.id || !existing.sourceCollectionId || existing.sourceCollectionId === parsed.id),
  );

  if (hasCachedSections && streamCountMatches) {
    return existing;
  }

  const pending = inFlightCollectionMetadata.get(playlistId);
  if (pending) {
    return pending;
  }

  if (
    hasCachedSections &&
    !streamCountMatches &&
    expectedStreamCount &&
    attemptedCountRefreshByPlaylist.get(playlistId) === expectedStreamCount
  ) {
    return existing;
  }

  const failedAt = failedRefreshAtByPlaylist.get(playlistId);
  if (failedAt !== undefined && Date.now() - failedAt < RETRY_AFTER_FAILURE_MS) {
    return existing;
  }

  if (!videos || videos.length === 0) return existing;

  const firstUrl = (videos[0].url || videos[0].id || "").trim();
  if (!firstUrl) return existing;

  const request = (async () => {
    try {
      const { fetchStream } = await import("./api-stream");
      const stream = await fetchStream(firstUrl);
      failedRefreshAtByPlaylist.delete(playlistId);
      if (expectedStreamCount && expectedStreamCount > 0) {
        attemptedCountRefreshByPlaylist.set(playlistId, expectedStreamCount);
      }
      if (stream.collections && stream.collections.length > 0) {
        const normName = playlistName.trim().toLowerCase();
        const matchedCol =
          (parsed?.id ? stream.collections.find((col) => col.id === parsed.id) : undefined) ??
          stream.collections.find((col) => {
            const ctitle = col.title.trim().toLowerCase();
            return Boolean(
              normName &&
                (ctitle === normName || normName.includes(ctitle) || ctitle.includes(normName)),
            );
          });

        if (matchedCol?.sections && matchedCol.sections.length > 0) {
          const sectionsMeta: SubscribedCollectionSectionMeta[] = matchedCol.sections.map(
            (sec) => ({
              id: sec.id,
              title: sec.title,
              videoUrls: sec.episodes.map((ep) => ep.url.trim()),
              episodes: sec.episodes.map((ep) => ({
                videoId: ep.videoId,
                title: ep.title,
                url: ep.url.trim(),
                thumbnailUrl: proxyImage(ep.thumbnailUrl),
              })),
            }),
          );

          const meta: SubscribedCollectionMeta = {
            id: playlistId,
            title: playlistName,
            originalTitle: matchedCol.title,
            sourceCollectionId: matchedCol.id,
            sections: sectionsMeta,
          };

          saveSubscribedCollectionMeta(meta);
          return meta;
        }
      }
    } catch (err) {
      failedRefreshAtByPlaylist.set(playlistId, Date.now());
      console.warn("Failed to fetch stream collection metadata:", err);
    }

    return existing;
  })().finally(() => {
    inFlightCollectionMetadata.delete(playlistId);
  });

  inFlightCollectionMetadata.set(playlistId, request);
  return request;
}

export function isCollectionPlaylist(playlist: {
  id?: string;
  url?: string;
  playlistType?: string;
  name?: string;
  description?: string;
}): boolean {
  const type = (playlist.playlistType ?? "").toLowerCase();
  const url = (playlist.url ?? "").toLowerCase();
  const id = (playlist.id ?? "").toLowerCase();

  // Series are sequentially ordered playlists, NOT collections with sections
  if (
    type === "series" ||
    [url, id].some(
      (val) =>
        val.includes("business=space_series") ||
        val.includes("/channel/seriesdetail") ||
        val.startsWith("series:") ||
        val.startsWith("bilibili:series:"),
    )
  ) {
    return false;
  }

  if (playlist.id && getSubscribedCollectionIds().has(playlist.id)) return true;
  const desc = (playlist.description ?? "").toLowerCase();
  if (desc.includes("[collection")) return true;
  const name = (playlist.name ?? "").toLowerCase();
  if (
    type === "collection" ||
    type === "season" ||
    type === "ugc_season" ||
    [url, id].some(
      (val) =>
        val.includes("/season/") ||
        val.includes("ugc_season") ||
        val.includes("business=space_collection") ||
        val.includes("/channel/collectiondetail") ||
        val.startsWith("season:") ||
        val.startsWith("bilibili:season:"),
    ) ||
    name.includes("合集") ||
    name.includes("合辑")
  ) {
    return true;
  }
  const metas = getSubscribedCollectionsMeta();
  if (playlist.id && metas[playlist.id]) return true;
  if (
    name &&
    Object.values(metas).some(
      (m) =>
        m.title.trim().toLowerCase() === name.trim().toLowerCase() ||
        (m.originalTitle && m.originalTitle.trim().toLowerCase() === name.trim().toLowerCase()),
    )
  ) {
    return true;
  }
  return false;
}
