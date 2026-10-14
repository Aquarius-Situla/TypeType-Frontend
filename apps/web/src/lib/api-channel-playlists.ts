import type { ChannelPlaylistsResponse } from "../types/playlist";
import { request } from "./api";
import {
  extractBilibiliChannelMid,
  fetchBilibiliChannelCollections,
} from "./api-bilibili-channel-collections";
import { API_BASE as BASE } from "./env";
import { optionalBearer } from "./optional-bearer";
import { detectProvider } from "./provider";

export function fetchChannelPlaylists(
  url: string,
  nextpage?: string,
): Promise<ChannelPlaylistsResponse> {
  if (detectProvider(url) === "bilibili") {
    const mid = extractBilibiliChannelMid(url);
    if (mid) {
      return fetchBilibiliChannelCollections(mid, nextpage);
    }
  }
  const params = new URLSearchParams({ url });
  if (nextpage) params.set("nextpage", nextpage);
  return request(`${BASE}/channel/playlists?${params}`, optionalBearer());
}
