import { useState } from "react";
import { isStreamUnavailableError } from "../hooks/use-stream";
import { familyListBlockedMessage, isChannelNotAllowedError } from "../lib/allow-list-error";
import { ApiError } from "../lib/api";
import { youtubeSessionActionForError } from "../lib/api-youtube-session";
import {
  isPermanentlyUnavailableError,
  resolveStreamErrorMessage,
} from "../lib/stream-error-message";
import { resolveVideoAvailability, videoAvailabilityCopy } from "../lib/video-availability";
import { youtubeSessionReturnToForWatch } from "../lib/youtube-session-route";
import { m } from "../paraglide/messages.js";
import { PlaylistSkipUnavailable } from "./playlist-skip-unavailable";
import { StreamError } from "./stream-error";

type Props = {
  error: unknown;
  publicParam: string;
  list?: string;
  shuffle?: string;
  poster?: string;
  onRetry: () => void;
};

export function WatchStreamError({ error, publicParam, list, shuffle, poster, onRetry }: Props) {
  const [skipping, setSkipping] = useState(false);
  const skipInPlaylist = Boolean(list) && isPermanentlyUnavailableError(error);
  const genericExtractorError =
    error instanceof ApiError &&
    error.status === 422 &&
    error.message ===
      "Error occurs when fetching the page. Try increase the loading timeout in Settings.";
  const availability = genericExtractorError ? "members_only" : resolveVideoAvailability(error);
  const youtubeSessionAction = youtubeSessionActionForError(error);
  const needsYoutubeSession = youtubeSessionAction !== null;
  const familyListBlocked = isChannelNotAllowedError(error);
  const youtubeSessionReturnTo = needsYoutubeSession
    ? youtubeSessionReturnToForWatch(publicParam, list, shuffle)
    : undefined;
  const streamErrorMessage = isStreamUnavailableError(error)
    ? m.ui_this_video_is_currently_unavailable()
    : resolveStreamErrorMessage(error);
  const message = availability
    ? videoAvailabilityCopy(availability, error instanceof Error ? error.message : undefined)
        .message
    : familyListBlocked
      ? familyListBlockedMessage()
      : needsYoutubeSession
        ? youtubeSessionAction === "reconnect"
          ? m.ui_reconnect_youtube_to_access_this_video()
          : m.ui_connect_youtube_to_access_this_video()
        : (streamErrorMessage ?? m.ui_failed_to_load_stream());

  return (
    <>
      {list && skipInPlaylist && (
        <PlaylistSkipUnavailable
          list={list}
          shuffle={shuffle}
          currentParam={publicParam}
          onScheduled={setSkipping}
        />
      )}
      <StreamError
        message={message}
        notice={skipInPlaylist && skipping ? m.ui_skipping_to_next_video() : undefined}
        familyListBlocked={familyListBlocked}
        availability={availability ?? undefined}
        poster={poster}
        onRetry={availability || needsYoutubeSession || familyListBlocked ? undefined : onRetry}
        youtubeSessionReturnTo={youtubeSessionReturnTo}
        youtubeSessionAction={youtubeSessionAction ?? undefined}
      />
    </>
  );
}
