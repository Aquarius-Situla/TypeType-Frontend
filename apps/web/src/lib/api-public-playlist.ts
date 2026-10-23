import type { PublicPlaylistResponse } from "../types/playlist";
import { request } from "./api";
import {
  isBilibiliCollectionUrl,
  toCanonicalBilibiliCollectionUrl,
} from "./api-bilibili-channel-collections";
import { API_BASE as BASE } from "./env";
import { optionalBearer } from "./optional-bearer";

export function fetchPublicPlaylist(
  url: string,
  nextpage?: string,
): Promise<PublicPlaylistResponse> {
  const targetUrl = isBilibiliCollectionUrl(url) ? toCanonicalBilibiliCollectionUrl(url) : url;
  const params = new URLSearchParams({ url: targetUrl });
  if (nextpage) params.set("nextpage", nextpage);
  return request(`${BASE}/playlist?${params}`, optionalBearer());
}
