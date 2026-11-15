export function playlistListId(url: string): string | null {
  try {
    return new URL(url).searchParams.get("list");
  } catch {
    return null;
  }
}

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
]);

export function youtubePlaylistId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!YOUTUBE_HOSTS.has(parsed.hostname) || parsed.pathname !== "/playlist") return null;
    return parsed.searchParams.get("list") || null;
  } catch {
    return null;
  }
}

export function playlistSearch(url: string): { list: string | undefined; url: string | undefined } {
  const list = youtubePlaylistId(url);
  return list ? { list, url: undefined } : { list: undefined, url };
}

export function playlistPath(url: string): string {
  const { list } = playlistSearch(url);
  return `/playlist?${new URLSearchParams(list ? { list } : { url }).toString()}`;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isManagedPlaylistId(id: string): boolean {
  return UUID_PATTERN.test(id);
}

// NicoNico mylists and series get a short list param, never a full URL: nicomylist.123 or nicoseries.123.
const NICONICO_LIST_PARAM = /^nico(mylist|series)\.(\d{1,12})$/;

export function niconicoPlaylistParam(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host !== "nicovideo.jp" && !host.endsWith(".nicovideo.jp")) return null;
    const match = parsed.pathname.match(/^(?:\/user\/\d{1,12})?\/(mylist|series)\/(\d{1,12})\/?$/);
    return match ? `nico${match[1]}.${match[2]}` : null;
  } catch {
    return null;
  }
}

export function niconicoPlaylistUrl(list: string): string | null {
  const match = list.match(NICONICO_LIST_PARAM);
  return match ? `https://www.nicovideo.jp/${match[1]}/${match[2]}` : null;
}
