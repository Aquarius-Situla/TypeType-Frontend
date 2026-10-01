import { BILIBILI_CHANNEL_ID_PATTERN } from "./channel-route-patterns";

export type CanonicalChannelRoute = {
  provider: "youtube" | "bilibili";
  id: string;
};

const YOUTUBE_PATH_PREFIXES = new Set(["@", "channel", "c", "user"]);

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
    if (!kind) return null;
    if (kind.startsWith("@")) return kind;
    if (YOUTUBE_PATH_PREFIXES.has(kind) && valueSegment) {
      return kind === "channel" ? valueSegment : `@${valueSegment}`;
    }
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

export function toCanonicalChannelRoute(value: string): CanonicalChannelRoute | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return youtubeChannelRouteFromUrl(trimmed) ?? bilibiliChannelRouteFromUrl(trimmed);
}
