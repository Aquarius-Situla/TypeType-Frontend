import type { ChannelPostsResponse } from "../types/community-post";
import { API_BASE as BASE } from "./env";
import { requestWithSession } from "./session-request";

export function fetchChannelPosts(url: string, nextpage?: string): Promise<ChannelPostsResponse> {
  const params = new URLSearchParams({ url });
  if (nextpage) params.set("nextpage", nextpage);
  return requestWithSession(`${BASE}/channel/posts?${params}`);
}
