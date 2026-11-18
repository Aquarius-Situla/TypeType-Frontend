import { isTwitchStreamId, twitchStreamIdFromSearch } from "./twitch-stream-id";
import { toPublicWatchParam, toWatchSourceUrl } from "./watch-url";

const TWITCH_WATCH_PATH = "/twitch/watch";

export function shouldKeepPersistentPlayerForRoute(
  streamId: string,
  locationHref: string,
  miniPlayerEnabled = true,
): boolean {
  const location = new URL(locationHref, "http://typetype.local");
  if (location.pathname === TWITCH_WATCH_PATH) {
    return (
      isTwitchStreamId(streamId) && twitchStreamIdFromSearch(location.searchParams) === streamId
    );
  }
  if (location.pathname !== "/watch") return miniPlayerEnabled;
  if (isTwitchStreamId(streamId)) return false;

  const requestedVideo = location.searchParams.get("v")?.trim();
  if (!requestedVideo) return false;

  return toPublicWatchParam(streamId) === toPublicWatchParam(toWatchSourceUrl(requestedVideo));
}

export function playerPagePath(href: string): string {
  return new URL(href, "http://typetype.local").pathname;
}
