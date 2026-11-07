import type { CommentSearchResponse, CommentsPageResponse } from "../types/api";
import { API_BASE as BASE } from "./env";
import { requestWithSession } from "./session-request";

export function fetchComments(url: string, nextpage?: string): Promise<CommentsPageResponse> {
  const params = new URLSearchParams({ url });
  if (nextpage) params.set("nextpage", nextpage);
  return requestWithSession(`${BASE}/comments?${params}`);
}

export function fetchCommentReplies(
  url: string,
  repliesPage: string,
): Promise<CommentsPageResponse> {
  const params = new URLSearchParams({ url, repliesPage });
  return requestWithSession(`${BASE}/comments/replies?${params}`);
}

export function searchComments(
  url: string,
  query: string,
  cursor?: string,
): Promise<CommentSearchResponse> {
  const params = new URLSearchParams({ url, q: query });
  if (cursor) params.set("cursor", cursor);
  return requestWithSession(`${BASE}/comments/search?${params}`);
}
