import type { ChannelSort } from "./api-discovery";

const YOUTUBE_CHANNEL_ID_PATTERN = /^UC[A-Za-z0-9_-]{22}$/;
const YOUTUBE_HANDLE_PATTERN = /^@[A-Za-z0-9._-]{2,48}$/;
const BILIBILI_CHANNEL_ID_PATTERN = /^\d{1,20}$/;
const NICONICO_CHANNEL_ID_PATTERN = /^\d{1,20}$/;

export type ChannelTab = "videos" | "live" | "playlists";

export function channelTabOrDefault(value: unknown): ChannelTab {
  return value === "live" || value === "playlists" ? value : "videos";
}

export type ChannelPathSearch = {
  sort?: ChannelSort;
  q?: string;
  tab?: "live" | "playlists";
};

export type ChannelLegacySearch = ChannelPathSearch & {
  url: string;
};

export type CanonicalChannelRoute = {
  provider: "youtube" | "bilibili" | "niconico";
  id: string;
};

function hostMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

function youtubeChannelParamFromUrl(value: string): string | null {
  try {
    const raw = value.trim();
    const withProto =
      raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    const parsed = new URL(withProto);
    if (!hostMatches(parsed.hostname.toLowerCase(), "youtube.com")) return null;
    const segments = parsed.pathname.split("/").filter(Boolean);
    const [kind, valueSegment] = segments;
    if (kind === "channel" && valueSegment && YOUTUBE_CHANNEL_ID_PATTERN.test(valueSegment)) {
      return valueSegment;
    }
    if (kind && YOUTUBE_HANDLE_PATTERN.test(kind)) return kind;
    return null;
  } catch {
    return null;
  }
}

function youtubeChannelRouteFromUrl(value: string): CanonicalChannelRoute | null {
  const id = youtubeChannelParamFromUrl(value);
  return id ? { provider: "youtube", id } : null;
}

function bilibiliChannelRouteFromUrl(value: string): CanonicalChannelRoute | null {
  try {
    const raw = value.trim();
    const withProto =
      raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    const parsed = new URL(withProto);
    const host = parsed.hostname.toLowerCase();
    if (host === "space.bilibili.com") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id && BILIBILI_CHANNEL_ID_PATTERN.test(id) ? { provider: "bilibili", id } : null;
    }
    if (host === "www.bilibili.com" || host === "bilibili.com") {
      const segments = parsed.pathname.split("/").filter(Boolean);
      if (segments[0] === "space" && segments[1] && BILIBILI_CHANNEL_ID_PATTERN.test(segments[1])) {
        return { provider: "bilibili", id: segments[1] };
      }
    }
    return null;
  } catch {
    return null;
  }
}

function niconicoChannelRouteFromUrl(value: string): CanonicalChannelRoute | null {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname !== "www.nicovideo.jp" && hostname !== "sp.nicovideo.jp") return null;
    const [kind, id] = parsed.pathname.split("/").filter(Boolean);
    if (kind !== "user" || !id || !NICONICO_CHANNEL_ID_PATTERN.test(id)) return null;
    return { provider: "niconico", id };
  } catch {
    return null;
  }
}

export function toCanonicalChannelRoute(sourceUrl: string): CanonicalChannelRoute | null {
  return (
    youtubeChannelRouteFromUrl(sourceUrl) ??
    bilibiliChannelRouteFromUrl(sourceUrl) ??
    niconicoChannelRouteFromUrl(sourceUrl)
  );
}

export function canonicalChannelSourceUrl(route: CanonicalChannelRoute): string | null {
  if (route.provider === "youtube") {
    const validId =
      YOUTUBE_CHANNEL_ID_PATTERN.test(route.id) || YOUTUBE_HANDLE_PATTERN.test(route.id);
    if (!validId) return null;
    return YOUTUBE_CHANNEL_ID_PATTERN.test(route.id)
      ? `https://www.youtube.com/channel/${route.id}`
      : `https://www.youtube.com/${route.id}`;
  }
  const validId =
    route.provider === "bilibili"
      ? BILIBILI_CHANNEL_ID_PATTERN.test(route.id)
      : NICONICO_CHANNEL_ID_PATTERN.test(route.id);
  if (!validId) return null;
  return route.provider === "bilibili"
    ? `https://space.bilibili.com/${route.id}`
    : `https://www.nicovideo.jp/user/${route.id}`;
}

export function toChannelSourceUrl(value: string): string {
  const trimmed = value.trim();
  if (YOUTUBE_CHANNEL_ID_PATTERN.test(trimmed)) return `https://www.youtube.com/channel/${trimmed}`;
  if (YOUTUBE_HANDLE_PATTERN.test(trimmed)) return `https://www.youtube.com/${trimmed}`;
  return trimmed;
}

function toPublicChannelParam(sourceUrl: string): string {
  return youtubeChannelParamFromUrl(sourceUrl) ?? sourceUrl.trim();
}

export function toChannelPathParam(sourceUrl: string): string | null {
  const publicParam = toPublicChannelParam(sourceUrl);
  return YOUTUBE_CHANNEL_ID_PATTERN.test(publicParam) || YOUTUBE_HANDLE_PATTERN.test(publicParam)
    ? publicParam
    : null;
}

export function channelPathSearch(
  sort: ChannelSort,
  query: string,
  tab: ChannelTab = "videos",
): ChannelPathSearch {
  const trimmedQuery = query.trim();
  const search: ChannelPathSearch = {};
  if (sort !== "latest") search.sort = sort;
  if (trimmedQuery.length > 0) search.q = trimmedQuery;
  if (tab !== "videos") search.tab = tab;
  return search;
}

export function channelLegacySearch(
  sourceUrl: string,
  sort: ChannelSort,
  query: string,
  tab: ChannelTab = "videos",
): ChannelLegacySearch {
  return { url: toPublicChannelParam(sourceUrl), ...channelPathSearch(sort, query, tab) };
}

export function channelRoutePath(sourceUrl: string): string {
  const canonicalRoute = toCanonicalChannelRoute(sourceUrl);
  if (canonicalRoute) return `/channel/${canonicalRoute.provider}/${canonicalRoute.id}`;
  const params = new URLSearchParams({ url: toPublicChannelParam(sourceUrl) });
  return `/channel?${params.toString()}`;
}
