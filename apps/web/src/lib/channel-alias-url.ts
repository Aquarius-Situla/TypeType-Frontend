import {
  type CanonicalChannelRoute,
  type ChannelTab,
  toCanonicalChannelRoute,
} from "./channel-route-url";

export type ChannelAliasLink = { url: string; tab: ChannelTab };

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);
const NICONICO_CHANNEL_HOST = "ch.nicovideo.jp";
const YOUTUBE_LEGACY_NAME = /^[\p{L}\p{N}._-]{1,100}$/u;
const YOUTUBE_VANITY_NAME = /^[\p{L}\p{N}_-]{1,100}$/u;
const NICONICO_CHANNEL_ID = /^ch\d{1,12}$/;
const NICONICO_CHANNEL_SLUG = /^[A-Za-z0-9_-]{1,64}$/;
const NICONICO_PAGES = new Set(["channel", "my", "portal", "search", "static"]);
const YOUTUBE_TABS: Record<string, ChannelTab> = {
  about: "videos",
  community: "posts",
  featured: "videos",
  playlists: "playlists",
  posts: "posts",
  shorts: "videos",
  streams: "live",
  videos: "videos",
};
const YOUTUBE_PAGES = new Set(
  "about account ads attribution_link c channel channels clip copyright courses creators e embed feed gaming hashtag howyoutubeworks jobs kids learning live logout movies music new news oembed pair paid_memberships playables playlist podcasts post premium redirect reporthistory results s shopping shorts signin signup source sports store subscription_manager supported_browsers t testtube trending tv upload user v verify_age watch yt youtubei".split(
    " ",
  ),
);

function parseUrl(value: string): URL | null {
  try {
    const raw = value.trim();
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
}

function pathSegments(url: URL): string[] {
  try {
    return url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  } catch {
    return [];
  }
}

function youtubeTab(segment: string | undefined): ChannelTab | null {
  if (!segment) return "videos";
  return Object.hasOwn(YOUTUBE_TABS, segment) ? YOUTUBE_TABS[segment] : null;
}

function youtubeAlias(segments: string[]): ChannelAliasLink | null {
  const [first, second] = segments;
  const legacy = first === "c" || first === "user";
  const name = legacy ? second : first;
  const rest = segments.slice(legacy ? 2 : 1);
  if (!name || rest.length > 1) return null;
  if (legacy ? !YOUTUBE_LEGACY_NAME.test(name) : !YOUTUBE_VANITY_NAME.test(name)) return null;
  if (!legacy && YOUTUBE_PAGES.has(name.toLowerCase())) return null;
  const tab = youtubeTab(rest[0]);
  if (!tab) return null;
  const path = `${legacy ? `${first}/` : ""}${encodeURIComponent(name)}`;
  return { url: `https://www.youtube.com/${path}`, tab };
}

function niconicoAlias(segments: string[]): ChannelAliasLink | null {
  const [first, second] = segments;
  if (first === "channel" && second && segments.length === 2 && NICONICO_CHANNEL_ID.test(second)) {
    return { url: `https://${NICONICO_CHANNEL_HOST}/channel/${second}`, tab: "videos" };
  }
  if (segments.length !== 1 || !NICONICO_CHANNEL_SLUG.test(first ?? "")) return null;
  if (NICONICO_PAGES.has(first.toLowerCase())) return null;
  return { url: `https://${NICONICO_CHANNEL_HOST}/${first}`, tab: "videos" };
}

// Channel addresses without a stable id: youtube.com/c/name, /user/name, /name and ch.nicovideo.jp/name.
// The returned link is rebuilt from the checked name, never copied from the input.
export function channelAliasLink(value: string): ChannelAliasLink | null {
  const url = parseUrl(value);
  if (!url || (url.protocol !== "https:" && url.protocol !== "http:")) return null;
  const host = url.hostname.toLowerCase();
  if (YOUTUBE_HOSTS.has(host)) return youtubeAlias(pathSegments(url));
  return host === NICONICO_CHANNEL_HOST ? niconicoAlias(pathSegments(url)) : null;
}

export function youtubeChannelLinkTab(value: string): ChannelTab {
  const url = parseUrl(value);
  if (!url || !YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return "videos";
  const segments = pathSegments(url);
  const canonicalLength = segments[0]?.startsWith("@") ? 1 : 2;
  return segments.length > canonicalLength ? (youtubeTab(segments.at(-1)) ?? "videos") : "videos";
}

export function channelRouteFromVideos(
  channelName: string | undefined,
  videos: readonly { channelName: string; channelUrl?: string }[],
): CanonicalChannelRoute | null {
  if (!channelName) return null;
  const own = videos.find((video) => video.channelName === channelName && video.channelUrl);
  return own?.channelUrl ? toCanonicalChannelRoute(own.channelUrl) : null;
}
