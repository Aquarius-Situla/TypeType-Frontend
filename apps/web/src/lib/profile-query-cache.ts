import type { QueryClient } from "@tanstack/react-query";

const PROFILE_QUERIES = new Set([
  "account-identity",
  "account-profiles",
  "allowed-channels",
  "blocked-channels",
  "blocked-keywords",
  "blocked-videos",
  "downloader-job",
  "favorites",
  "history",
  "history-all",
  "history-filtered",
  "home-recommendations",
  "notifications",
  "notifications-unread-count",
  "notification-toast-candidates",
  "playlists",
  "portability-job",
  "portability-imports",
  "profile",
  "progress",
  "progress-batch",
  "rss-feeds",
  "saved-playlists",
  "search-history",
  "search-panel-videos",
  "settings",
  "shorts-recommendations",
  "shorts-subscriptions-fallback",
  "subscription-feed",
  "subscription-groups",
  "subscription-group-memberships",
  "subscriptions",
  "watch-later",
  "watch-recommendations",
  "youtube-import-flow",
  "youtube-import-status",
  "youtube-session",
]);

const isProfileQuery = ({ queryKey }: { queryKey: readonly unknown[] }): boolean =>
  typeof queryKey[0] === "string" && PROFILE_QUERIES.has(queryKey[0]);

export function resetProfileQueries(client: QueryClient): Promise<void> {
  // Reset cancels old responses and notifies mounted observers; removing queries does not.
  // Media extraction and playback state deliberately stay outside this boundary.
  return client.resetQueries({
    predicate: isProfileQuery,
  });
}

export async function clearProfileQueries(client: QueryClient): Promise<void> {
  const filters = { predicate: isProfileQuery };
  await client.cancelQueries(filters);
  client.removeQueries(filters);
}
