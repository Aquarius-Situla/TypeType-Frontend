import { toCanonicalChannelRoute } from "./channel-route-url";
import { canonicalYoutubeEmbed, externalPagePath } from "./external-page-link";
import { youtubePlaylistId } from "./playlist-url";
import { twitchUrlTarget } from "./twitch-url";
import { toPublicWatchParam, watchServiceId } from "./watch-url";

const LIST_ID = /^[A-Za-z0-9_-]{10,64}$/;
const START_TIME = /^(?:\d{1,6}|(?=\d)(?:\d{1,3}h)?(?:\d{1,3}m)?(?:\d{1,5}s)?)$/;
const UNSUPPORTED = -1;
const NICONICO_SHORT_ID = /^(?:sm|nm|so)\d{1,12}$/;
const BILIBILI_SHORT_CODE = /^[A-Za-z0-9]{4,16}$/;

function webUrl(href: string): URL | null {
  try {
    const url = new URL(href.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function niconicoShortLink(url: URL): URL {
  const id = url.pathname.slice(1);
  if (url.hostname !== "nico.ms" || !NICONICO_SHORT_ID.test(id)) return url;
  return new URL(`https://www.nicovideo.jp/watch/${id}`);
}

function watchPath(url: URL): string | null {
  if (watchServiceId(url.href, UNSUPPORTED) === UNSUPPORTED) return null;
  const search = new URLSearchParams({ v: toPublicWatchParam(url.href) });
  const list = url.searchParams.get("list");
  if (list && LIST_ID.test(list)) search.set("list", list);
  const start = url.searchParams.get("t");
  if (start && START_TIME.test(start)) search.set("t", start);
  return `/watch?${search.toString()}`;
}

// b23.tv share links hide their video behind a redirect that only the server follows.
export function bilibiliShortCode(href: string): string | null {
  const url = webUrl(href);
  if (url?.hostname.toLowerCase() !== "b23.tv") return null;
  const code = url.pathname.slice(1);
  return BILIBILI_SHORT_CODE.test(code) ? code : null;
}

// Only identifiers that passed a strict pattern reach the internal route, never the link itself.
export function resolveInternalLink(href: string, options: { twitch: boolean }): string | null {
  const parsed = webUrl(href);
  if (!parsed) return null;
  const url = canonicalYoutubeEmbed(niconicoShortLink(parsed));
  const watch = watchPath(url);
  if (watch) return watch;
  const playlist = youtubePlaylistId(url.href);
  if (playlist && LIST_ID.test(playlist)) {
    return `/playlist?${new URLSearchParams({ list: playlist }).toString()}`;
  }
  const channel = toCanonicalChannelRoute(url.href);
  if (channel) return `/channel/${channel.provider}/${channel.id}`;
  const twitch = options.twitch ? twitchUrlTarget(url.href) : null;
  if (twitch) return `/twitch/watch?${new URLSearchParams(twitch).toString()}`;
  return externalPagePath(url, options);
}
