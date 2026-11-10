import type { ChannelPlaylistsResponse } from "../types/playlist";
import { API_BASE as BASE } from "./env";

export type ChannelPlaylistTab = "playlists" | "courses";

import { requestWithSession } from "./session-request";

export function fetchChannelPlaylists(
  url: string,
  nextpage?: string,
  tab: ChannelPlaylistTab = "playlists",
): Promise<ChannelPlaylistsResponse> {
  const params = new URLSearchParams({ url });
  if (nextpage) params.set("nextpage", nextpage);
  if (tab !== "playlists") params.set("tab", tab);
  return requestWithSession(`${BASE}/channel/playlists?${params}`);
}
