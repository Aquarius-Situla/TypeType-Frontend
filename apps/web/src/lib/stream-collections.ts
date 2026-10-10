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

export type SubscribedCollectionEpisodeMeta = {
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

export function deriveSectionsFromVideos(
  videos: { url: string; title?: string }[],
): SubscribedCollectionSectionMeta[] {
  if (!videos || videos.length === 0) return [];
  const groups = new Map<string, string[]>();
  for (const v of videos) {
    const match = (v.title ?? "").match(/【([^】]+)】/);
    const tag = match ? match[1].trim() : "其他";
    let list = groups.get(tag);
    if (!list) {
      list = [];
      groups.set(tag, list);
    }
    const url = v.url.trim();
    if (!list.includes(url)) {
      list.push(url);
    }
  }
  if (groups.size >= 2) {
    return Array.from(groups.entries()).map(([title, videoUrls], idx) => ({
      id: `derived-${idx}-${title}`,
      title,
      videoUrls,
    }));
  }
  return [];
}

const SUBSCRIBED_COLLECTIONS_KEY = "typetype:subscribed-collections";
const SUBSCRIBED_COLLECTIONS_META_KEY = "typetype:subscribed-collections-meta";

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

export function getSubscribedCollectionsMeta(): Record<string, SubscribedCollectionMeta> {
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

export function saveSubscribedCollectionMeta(meta: SubscribedCollectionMeta): void {
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

export function addSubscribedCollectionId(id: string, meta?: SubscribedCollectionMeta): void {
  if (typeof window === "undefined" || !id) return;
  try {
    const ids = getSubscribedCollectionIds();
    ids.add(id);
    localStorage.setItem(SUBSCRIBED_COLLECTIONS_KEY, JSON.stringify([...ids]));
    if (meta) {
      saveSubscribedCollectionMeta({ ...meta, id });
    }
  } catch {}
}

export function removeSubscribedCollectionId(id: string): void {
  if (typeof window === "undefined" || !id) return;
  try {
    const ids = getSubscribedCollectionIds();
    ids.delete(id);
    localStorage.setItem(SUBSCRIBED_COLLECTIONS_KEY, JSON.stringify([...ids]));
    const metas = getSubscribedCollectionsMeta();
    if (metas[id]) {
      delete metas[id];
      localStorage.setItem(SUBSCRIBED_COLLECTIONS_META_KEY, JSON.stringify(metas));
    }
  } catch {}
}

export function extractCollectionOriginalTitle(playlist: {
  name?: string;
  description?: string;
  id?: string;
}): string {
  if (playlist.id) {
    const meta = getSubscribedCollectionMeta(playlist.id);
    if (meta?.originalTitle) return meta.originalTitle;
  }
  const desc = playlist.description ?? "";
  const match = desc.match(/\[collection(?::([^\]]+))?\]/i);
  if (match?.[1]) return match[1].trim();
  return playlist.name ?? "";
}

export function findSubscribedCollection(
  collectionName: string,
  playlists: { id: string; name?: string; description?: string }[],
  sourceCollectionId?: string,
): { id: string; name: string } | undefined {
  const normName = collectionName.trim().toLowerCase();
  const metas = getSubscribedCollectionsMeta();

  if (sourceCollectionId) {
    for (const [id, meta] of Object.entries(metas)) {
      if (meta.sourceCollectionId === sourceCollectionId) {
        const p = playlists.find((pl) => pl.id === id);
        if (p) return { id: p.id, name: p.name ?? meta.title };
      }
    }
  }

  for (const p of playlists) {
    if (!isCollectionPlaylist(p)) continue;
    const meta = metas[p.id];
    if (meta?.originalTitle && meta.originalTitle.trim().toLowerCase() === normName) {
      return { id: p.id, name: p.name ?? meta.title };
    }
    const orig = extractCollectionOriginalTitle(p);
    if (orig && orig.trim().toLowerCase() === normName) {
      return { id: p.id, name: p.name ?? orig };
    }
    if (p.name && p.name.trim().toLowerCase() === normName) {
      return { id: p.id, name: p.name };
    }
  }

  return undefined;
}

export async function ensureCollectionMetadata(
  playlistId: string,
  playlistName: string,
  videos: { url: string; title?: string }[],
): Promise<SubscribedCollectionMeta | undefined> {
  const existing = getSubscribedCollectionMeta(playlistId);
  if (existing?.sections && existing.sections.length > 0) {
    return existing;
  }

  if (!videos || videos.length === 0) return existing;

  try {
    const firstUrl = videos[0].url.trim();
    if (firstUrl) {
      const { fetchStream } = await import("./api-stream");
      const stream = await fetchStream(firstUrl);
      if (stream.collections && stream.collections.length > 0) {
        const normName = playlistName.trim().toLowerCase();
        const matchedCol =
          stream.collections.find((col) => {
            const ctitle = col.title.trim().toLowerCase();
            return ctitle === normName || normName.includes(ctitle) || ctitle.includes(normName);
          }) ?? stream.collections[0];

        if (matchedCol.sections && matchedCol.sections.length > 0) {
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
    }
  } catch {}

  const derived = deriveSectionsFromVideos(videos);
  if (derived.length > 0) {
    const meta: SubscribedCollectionMeta = {
      id: playlistId,
      title: playlistName,
      originalTitle: playlistName,
      sections: derived,
    };
    saveSubscribedCollectionMeta(meta);
    return meta;
  }

  return existing;
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
  if (desc.includes("[collection") || desc.includes("[series")) return true;
  const type = (playlist.playlistType ?? "").toLowerCase();
  const url = (playlist.url ?? "").toLowerCase();
  const name = (playlist.name ?? "").toLowerCase();
  if (
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
    name.includes("选修") ||
    name.includes("必修") ||
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
