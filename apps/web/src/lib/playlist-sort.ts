import { m } from "../paraglide/messages.js";
import type { PlaylistVideoItem } from "../types/user";

export type PlaylistSortMode =
  | "manual"
  | "added-new"
  | "added-old"
  | "posted-new"
  | "posted-old"
  | "popular";

export const PLAYLIST_SORT_OPTIONS: { value: PlaylistSortMode; label: () => string }[] = [
  { value: "manual", label: () => m.playlist_sort_manual() },
  { value: "added-new", label: () => m.playlist_sort_added_newest() },
  { value: "added-old", label: () => m.playlist_sort_added_oldest() },
  { value: "posted-new", label: () => m.playlist_sort_posted_newest() },
  { value: "posted-old", label: () => m.playlist_sort_posted_oldest() },
  { value: "popular", label: () => m.playlist_sort_popularity() },
];

const EPISODE_NUMBER_REGEX = /(?:^|\s|第|P|p|[【\[])(\d+)(?:[.\s、期讲集话部\]】]|$)/;

export function extractEpisodeNumber(title?: string): number | null {
  if (!title) return null;
  const match = title.match(EPISODE_NUMBER_REGEX);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  return Number.isNaN(num) ? null : num;
}

export function sortPlaylistVideos(
  videos: PlaylistVideoItem[],
  mode: PlaylistSortMode,
  isCollection = false,
): PlaylistVideoItem[] {
  const sorted = [...videos];
  switch (mode) {
    case "added-new":
      return sorted.sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0));
    case "added-old":
      return sorted.sort((a, b) => (a.addedAt ?? 0) - (b.addedAt ?? 0));
    case "posted-new":
      return sorted.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
    case "posted-old":
      return sorted.sort((a, b) => (a.publishedAt ?? 0) - (b.publishedAt ?? 0));
    case "popular":
      return sorted.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
    default:
      if (isCollection) {
        return sorted.sort((a, b) => {
          const numA = extractEpisodeNumber(a.title);
          const numB = extractEpisodeNumber(b.title);
          if (numA !== null && numB !== null) {
            if (numA !== numB) return numA - numB;
          } else if (numA !== null) {
            return -1;
          } else if (numB !== null) {
            return 1;
          }
          if (a.position !== b.position) return a.position - b.position;
          return (a.title ?? "").localeCompare(b.title ?? "", "zh-Hans-CN", { numeric: true });
        });
      }
      return sorted.sort((a, b) => a.position - b.position);
  }
}
