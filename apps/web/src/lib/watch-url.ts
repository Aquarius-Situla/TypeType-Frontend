const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const NICONICO_VIDEO_ID_PATTERN = /^sm\d+$/i;
const BILIBILI_VIDEO_ID_PATTERN = /^BV[A-Za-z0-9]{10}$/i;
const BILIBILI_WATCH_PARAM_PATTERN = /^(BV[A-Za-z0-9]{10})(?:\?p=(\d+))?$/i;

type WatchRouteSearch = {
  v: string;
};

function hostMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

function parseUrl(value: string): URL | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed);
  } catch {
    try {
      return new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }
}

function isSupportedVideoHost(host: string): boolean {
  return (
    host === "youtu.be" ||
    hostMatches(host, "youtube.com") ||
    host === "nico.ms" ||
    hostMatches(host, "nicovideo.jp") ||
    host === "b23.tv" ||
    hostMatches(host, "bilibili.com")
  );
}

function youtubeIdFromPath(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const nestedVideoPath =
    segments[0] === "shorts" || segments[0] === "embed" || segments[0] === "live";
  const candidate = nestedVideoPath ? segments[1] : segments[0];
  return candidate && YOUTUBE_VIDEO_ID_PATTERN.test(candidate) ? candidate : null;
}

function youtubeVideoIdFromUrl(value: string): string | null {
  const parsed = parseUrl(value);
  if (!parsed) return null;
  const host = parsed.hostname.toLowerCase();
  if (host === "youtu.be") return youtubeIdFromPath(parsed.pathname);
  if (!hostMatches(host, "youtube.com")) return null;
  const watchId = parsed.searchParams.get("v");
  if (watchId && YOUTUBE_VIDEO_ID_PATTERN.test(watchId)) return watchId;
  return youtubeIdFromPath(parsed.pathname);
}

function niconicoVideoIdFromUrl(value: string): string | null {
  const parsed = parseUrl(value);
  if (!parsed || !hostMatches(parsed.hostname.toLowerCase(), "nicovideo.jp")) return null;
  const segments = parsed.pathname.split("/").filter(Boolean);
  const candidate = segments[0] === "watch" ? segments[1] : null;
  return candidate && NICONICO_VIDEO_ID_PATTERN.test(candidate) ? candidate : null;
}

function bilibiliWatchParamFromUrl(value: string): string | null {
  const parsed = parseUrl(value);
  if (!parsed || !hostMatches(parsed.hostname.toLowerCase(), "bilibili.com")) return null;
  const segments = parsed.pathname.split("/").filter(Boolean);
  const candidate = segments[0] === "video" ? segments[1] : null;
  if (!candidate || !BILIBILI_VIDEO_ID_PATTERN.test(candidate)) return null;
  const page = Number(parsed.searchParams.get("p") ?? "1");
  return Number.isSafeInteger(page) && page > 1 ? `${candidate}?p=${page}` : candidate;
}

export function isYoutubeShortShareUrl(value: string): boolean {
  const parsed = parseUrl(value);
  return Boolean(
    parsed && parsed.hostname.toLowerCase() === "youtu.be" && youtubeIdFromPath(parsed.pathname),
  );
}

export function youtubeVideoId(value: string): string | null {
  const trimmed = value.trim();
  return YOUTUBE_VIDEO_ID_PATTERN.test(trimmed) ? trimmed : youtubeVideoIdFromUrl(trimmed);
}

export function youtubeThumbnailUrl(value: string): string | null {
  const videoId = youtubeVideoId(value);
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hq720.jpg` : null;
}

export function toWatchSourceUrl(value: string): string {
  const trimmed = value.trim();
  if (YOUTUBE_VIDEO_ID_PATTERN.test(trimmed)) {
    return `https://www.youtube.com/watch?v=${trimmed}`;
  }
  if (NICONICO_VIDEO_ID_PATTERN.test(trimmed)) {
    return `https://www.nicovideo.jp/watch/${trimmed}`;
  }
  const bilibili = trimmed.match(BILIBILI_WATCH_PARAM_PATTERN);
  if (bilibili) {
    const page = Number(bilibili[2] ?? "1");
    const suffix = Number.isSafeInteger(page) && page > 1 ? `?p=${page}` : "";
    return `https://www.bilibili.com/video/${bilibili[1]}${suffix}`;
  }
  const parsed = parseUrl(trimmed);
  if (parsed) {
    const v = parsed.searchParams.get("v");
    if (v && v !== trimmed) {
      return toWatchSourceUrl(v);
    }
    if (isSupportedVideoHost(parsed.hostname.toLowerCase())) {
      return `${parsed.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  }
  return trimmed;
}

export function toPublicWatchParam(sourceUrl: string): string {
  const trimmed = sourceUrl.trim();
  const bilibiliMatch = trimmed.match(BILIBILI_WATCH_PARAM_PATTERN);
  if (bilibiliMatch) {
    const page = Number(bilibiliMatch[2] ?? "1");
    return Number.isSafeInteger(page) && page > 1
      ? `${bilibiliMatch[1]}?p=${page}`
      : bilibiliMatch[1];
  }
  const parsed = parseUrl(trimmed);
  if (parsed) {
    const v = parsed.searchParams.get("v");
    if (v && v !== trimmed) {
      return toPublicWatchParam(v);
    }
  }
  return (
    youtubeVideoIdFromUrl(trimmed) ??
    niconicoVideoIdFromUrl(trimmed) ??
    bilibiliWatchParamFromUrl(trimmed) ??
    trimmed
  );
}

export function watchServiceId(sourceUrl: string, fallback: number): number {
  const value = sourceUrl.trim();
  if (youtubeVideoId(value)) return 0;
  if (NICONICO_VIDEO_ID_PATTERN.test(value) || niconicoVideoIdFromUrl(value)) return 1;
  if (BILIBILI_WATCH_PARAM_PATTERN.test(value) || bilibiliWatchParamFromUrl(value)) return 2;
  return fallback;
}

export function watchRouteSearch(sourceUrl: string): WatchRouteSearch {
  return { v: toPublicWatchParam(sourceUrl) };
}

export function watchListSearch(
  sourceUrl: string,
  listId?: string,
): WatchRouteSearch & {
  list?: string;
} {
  const base = watchRouteSearch(sourceUrl);
  return listId ? { ...base, list: listId } : base;
}

export function toPublicWatchUrl(sourceUrl: string, origin: string): string {
  const url = new URL("/watch", origin);
  url.searchParams.set("v", toPublicWatchParam(sourceUrl));
  return url.toString();
}
