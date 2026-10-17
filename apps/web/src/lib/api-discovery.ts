import { useAuthStore } from "../stores/auth-store";
import type { ChannelResponse, SearchFiltersResponse, SearchPageResponse } from "../types/api";
import { request } from "./api";
import { authedJson } from "./authed";
import { API_BASE as BASE } from "./env";
import { optionalBearer } from "./optional-bearer";

export type ChannelSort = "latest" | "popular" | "oldest";

export function fetchSearchFilters(
  service: number,
  contentFilter?: string,
  signal?: AbortSignal,
): Promise<SearchFiltersResponse> {
  const params = new URLSearchParams({ service: String(service) });
  if (contentFilter) params.set("contentFilter", contentFilter);
  return request(`${BASE}/search/filters?${params}`, optionalBearer({ signal }));
}

export function fetchSearch(
  q: string,
  service: number,
  nextpage?: string,
  contentFilter?: string,
  filters: readonly string[] = [],
  signal?: AbortSignal,
): Promise<SearchPageResponse> {
  const params = new URLSearchParams({ q, service: String(service) });
  if (nextpage) params.set("nextpage", nextpage);
  if (contentFilter) params.set("contentFilter", contentFilter);
  for (const filter of filters) params.append("filter", filter);
  return request(`${BASE}/search?${params}`, optionalBearer({ signal }));
}

export function fetchChannel(
  url: string,
  nextpage?: string,
  sort?: ChannelSort,
): Promise<ChannelResponse> {
  const endpoint = `${BASE}/channel/page`;
  const init = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, nextpage: nextpage ?? null, sort: sort ?? null }),
  };
  return useAuthStore.getState().token
    ? authedJson<ChannelResponse>(endpoint, init)
    : request<ChannelResponse>(endpoint, init);
}
