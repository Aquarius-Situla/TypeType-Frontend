import type { WatchPlaylistItem } from "../types/playlist";
import type { StreamPartItem } from "../types/stream-parts";
import { proxyImage } from "./proxy";

export function streamPartPlaylistItems(parts: StreamPartItem[] | undefined): WatchPlaylistItem[] {
  if (!parts?.length) return [];

  const seen = new Set<string>();
  const items: WatchPlaylistItem[] = [];
  for (const part of [...parts].sort((left, right) => left.page - right.page)) {
    const url = part.url.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    items.push({
      key: `part-${part.page}-${url}`,
      url,
      title: part.title,
      thumbnail: proxyImage(part.thumbnailUrl),
    });
  }
  return items;
}
