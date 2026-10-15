import { m } from "../paraglide/messages.js";
import type { ChannelSort } from "./api-discovery";

export const CHANNEL_SORT_OPTIONS: { value: ChannelSort; label: () => string }[] = [
  { value: "latest", label: () => m.channel_sort_newest() },
  { value: "popular", label: () => m.channel_sort_popular() },
  { value: "oldest", label: () => m.channel_sort_oldest() },
];

export function channelSortOptions(isBilibili = false): { value: ChannelSort; label: () => string }[] {
  if (isBilibili) {
    return CHANNEL_SORT_OPTIONS.filter((option) => option.value !== "oldest");
  }
  return CHANNEL_SORT_OPTIONS;
}

function toChannelSort(value: unknown): ChannelSort | undefined {
  if (value === "latest" || value === "newest") return "latest";
  if (value === "popular") return "popular";
  if (value === "oldest" || value === "old") return "oldest";
  return undefined;
}

export function channelSortOrDefault(value: unknown, isBilibili = false): ChannelSort {
  const sort = toChannelSort(value) ?? "latest";
  if (isBilibili && sort === "oldest") return "latest";
  return sort;
}
