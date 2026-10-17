import { normalizeBlockedKeyword, titleMatchesBlockedKeyword } from "./blocked-keyword-filter";

export type BlockedChannelIdentity = {
  url?: string | null;
  name?: string | null;
};

export type BlockableVideo = BlockedChannelIdentity & {
  id?: string | null;
  title?: string | null;
  channelUrl?: string | null;
  channelName?: string | null;
  requiresMembership?: boolean;
  isShortFormContent?: boolean;
  streamType?: string;
};

type BlockedItem = {
  url: string;
  name?: string | null;
};

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
]);

function youtubeVideoId(url: URL): string | null {
  if (url.hostname.toLowerCase() === "youtu.be") return url.pathname.split("/")[1] || null;
  if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;
  const queryId = url.searchParams.get("v");
  if (queryId) return queryId;
  const [kind, id] = url.pathname.split("/").filter(Boolean);
  return kind && ["embed", "live", "shorts"].includes(kind.toLowerCase()) ? (id ?? null) : null;
}

export function normalizeBlockedContentUrl(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    const videoId = youtubeVideoId(url);
    if (videoId) return `youtube:video:${videoId}`;
    const hostname = YOUTUBE_HOSTS.has(url.hostname.toLowerCase())
      ? "youtube.com"
      : url.hostname.toLowerCase();
    const port = url.port ? `:${url.port}` : "";
    const path = url.pathname.replace(/\/+$/, "") || "/";
    return `${hostname}${port}${path}`;
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? "").normalize("NFKC").trim().toLowerCase();
}

export function createBlockedContentMatcher(
  channels: BlockedItem[],
  videos: BlockedItem[],
  keywords: string[],
) {
  const channelsByUrl = new Map<string, BlockedItem>();
  const channelsByName = new Map<string, BlockedItem>();
  const videosByUrl = new Map<string, BlockedItem>();
  for (const item of channels) {
    const url = normalizeBlockedContentUrl(item.url);
    const name = normalizeName(item.name);
    if (url) channelsByUrl.set(url, item);
    if (name) channelsByName.set(name, item);
  }
  for (const item of videos) {
    const url = normalizeBlockedContentUrl(item.url);
    if (url) videosByUrl.set(url, item);
  }
  const channelUrls = new Set(channelsByUrl.keys());
  const videoUrls = new Set(videosByUrl.keys());
  const normalizedKeywords = keywords.map(normalizeBlockedKeyword).filter(Boolean);

  function findBlockedChannel(channel: BlockedChannelIdentity): BlockedItem | undefined {
    const url = normalizeBlockedContentUrl(channel.url);
    const name = normalizeName(channel.name);
    return (
      (url ? channelsByUrl.get(url) : undefined) ?? (name ? channelsByName.get(name) : undefined)
    );
  }

  function isChannelBlocked(channel: BlockedChannelIdentity): boolean {
    return findBlockedChannel(channel) !== undefined;
  }

  function findBlockedVideo(video: Pick<BlockableVideo, "id" | "url">): BlockedItem | undefined {
    const candidates = new Set(
      [video.url, video.id].map(normalizeBlockedContentUrl).filter((url) => url.length > 0),
    );
    for (const candidate of candidates) {
      const item = videosByUrl.get(candidate);
      if (item) return item;
    }
    return undefined;
  }

  function isVideoExplicitlyBlocked(video: Pick<BlockableVideo, "id" | "url">): boolean {
    return findBlockedVideo(video) !== undefined;
  }

  function isVideoBlocked(video: BlockableVideo): boolean {
    return (
      isVideoExplicitlyBlocked(video) ||
      isChannelBlocked({ url: video.channelUrl, name: video.channelName }) ||
      titleMatchesBlockedKeyword(video.title ?? "", normalizedKeywords)
    );
  }

  function filterVideos<T extends BlockableVideo>(items: T[]): T[] {
    return items.filter((item) => !isVideoBlocked(item));
  }

  return {
    channelUrls,
    normalizedKeywords,
    videoUrls,
    filterVideos,
    findBlockedChannel,
    findBlockedVideo,
    isChannelBlocked,
    isVideoBlocked,
    isVideoExplicitlyBlocked,
  };
}
