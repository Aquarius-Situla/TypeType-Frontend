// Pages of the supported sites that TypeType has its own page for, besides videos, playlists and channels. Every
// value that reaches an internal route passed a strict pattern or is only a search term.
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const TWITCH_LOGIN = /^[a-z0-9_]{1,25}$/i;
const TWITCH_SLUG = /^[a-z0-9-]{1,100}$/;
const TWITCH_TAG = /^[\p{L}\p{Nd}]{1,25}$/u;
const TWITCH_CHANNEL_TABS = new Set(["videos", "clips", "about", "schedule"]);
const MAX_TERM = 100;
const SEARCH_SERVICE = { youtube: 0, bilibili: 5, niconico: 6 } as const;

function hostIs(url: URL, ...domains: string[]): boolean {
  const host = url.hostname.toLowerCase();
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function segments(url: URL): string[] {
  try {
    return url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  } catch {
    return [];
  }
}

function searchPath(term: string | null | undefined, service: number): string | null {
  const q = term?.trim().slice(0, MAX_TERM);
  return q ? `/search?${new URLSearchParams({ q, service: String(service) }).toString()}` : null;
}

// Embed forms that the watch page does not read: youtube-nocookie.com/embed/ID and youtube.com/v/ID.
export function canonicalYoutubeEmbed(url: URL): URL {
  const [kind, id] = segments(url);
  const embed = hostIs(url, "youtube-nocookie.com") && kind === "embed";
  const legacy = hostIs(url, "youtube.com") && kind === "v";
  if ((embed || legacy) && id && YOUTUBE_ID.test(id)) {
    return new URL(`https://www.youtube.com/watch?v=${id}`);
  }
  return url;
}

function sitePagePath(url: URL): string | null {
  const [first, second] = segments(url);
  if (hostIs(url, "youtube.com")) {
    if (first === "results")
      return searchPath(url.searchParams.get("search_query"), SEARCH_SERVICE.youtube);
    if (first === "hashtag" && second) return searchPath(`#${second}`, SEARCH_SERVICE.youtube);
  }
  if (hostIs(url, "search.bilibili.com")) {
    return searchPath(url.searchParams.get("keyword"), SEARCH_SERVICE.bilibili);
  }
  if (hostIs(url, "nicovideo.jp") && (first === "search" || first === "tag") && second) {
    return searchPath(second, SEARCH_SERVICE.niconico);
  }
  return null;
}

function twitchPagePath(url: URL): string | null {
  if (!hostIs(url, "twitch.tv") || hostIs(url, "clips.twitch.tv")) return null;
  const [first, second, third, fourth] = segments(url);
  if (first === "search") {
    const q = url.searchParams.get("term")?.trim().slice(0, MAX_TERM);
    return q ? `/twitch/search?${new URLSearchParams({ q }).toString()}` : null;
  }
  if (first === "directory") {
    if (second === "category" && third && TWITCH_SLUG.test(third))
      return `/twitch/category/${third}`;
    if (second === "all" && third === "tags" && fourth && TWITCH_TAG.test(fourth)) {
      return `/twitch/tag/${encodeURIComponent(fourth)}`;
    }
    return null;
  }
  if (first && second && TWITCH_LOGIN.test(first) && TWITCH_CHANNEL_TABS.has(second)) {
    return `/twitch/channel/${first.toLowerCase()}`;
  }
  return null;
}

export function externalPagePath(url: URL, options: { twitch: boolean }): string | null {
  return sitePagePath(url) ?? (options.twitch ? twitchPagePath(url) : null);
}
