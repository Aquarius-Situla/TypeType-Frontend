import { createFileRoute } from "@tanstack/react-router";
import { EmbedError } from "../components/embed-error";
import { EmbedGuestRequired } from "../components/embed-guest-required";
import { EmbedLoading } from "../components/embed-loading";
import { EmbedPlayerShell } from "../components/embed-player-shell";
import { useAuth } from "../hooks/use-auth";
import { useInstance } from "../hooks/use-instance";
import { useSettings } from "../hooks/use-settings";
import { isStreamUnavailableError, useSabrBootstrap, useStream } from "../hooks/use-stream";
import { familyListBlockedMessage, isChannelNotAllowedError } from "../lib/allow-list-error";
import { ApiError } from "../lib/api";
import { youtubeSessionActionForError } from "../lib/api-youtube-session";
import { isEmbeddedFrame, resolveEmbedAccess } from "../lib/embed-access";
import { parseFocusBlockError } from "../lib/focus-block-error";
import { parseStartTime } from "../lib/parse-start-time";
import { selectProgressiveWatchStream } from "../lib/progressive-watch-stream";
import { proxyImage } from "../lib/proxy";
import { resolveStreamErrorMessage } from "../lib/stream-error-message";
import { resolveVideoAvailability, videoAvailabilityCopy } from "../lib/video-availability";
import { toPublicWatchParam, toWatchSourceUrl, youtubeThumbnailUrl } from "../lib/watch-url";
import { m } from "../paraglide/messages.js";

type EmbedSearch = {
  t?: string | number;
  start?: string | number;
  time_continue?: string | number;
  autoplay?: number;
};

function EmbedPage() {
  const { videoId } = Route.useParams();
  const { t, start, time_continue, autoplay } = Route.useSearch();
  const framed = isEmbeddedFrame();
  const sourceUrl = toWatchSourceUrl(videoId);
  const watchUrl = `/watch?v=${encodeURIComponent(toPublicWatchParam(sourceUrl))}`;
  const {
    data: instance,
    isPending: instancePending,
    isError: instanceError,
    refetch: retryInstance,
  } = useInstance();
  const { authReady, isAuthed, isGuest } = useAuth();
  const guestAllowed = instance?.guestAllowed ?? false;
  const accessWithoutSettings = resolveEmbedAccess({
    framed,
    guestAllowed,
    authReady,
    isAuthed,
    isGuest,
    settingsReady: false,
  });
  const { settingsReady } = useSettings({
    forceAnonymous: !accessWithoutSettings.sessionEnabled,
  });
  const access = resolveEmbedAccess({
    framed,
    guestAllowed,
    authReady,
    isAuthed,
    isGuest,
    settingsReady,
  });
  const useAuthenticatedStream = access.sessionEnabled;
  const streamQuery = useStream(sourceUrl, useAuthenticatedStream, access.streamEnabled);
  const bootstrap = useSabrBootstrap(sourceUrl, useAuthenticatedStream, access.streamEnabled);
  const publicParam = toPublicWatchParam(sourceUrl);
  const availabilityPoster = proxyImage(youtubeThumbnailUrl(publicParam) ?? "");
  const activeStream = selectProgressiveWatchStream(
    streamQuery.isPlaceholderData ? undefined : streamQuery.data,
    bootstrap.data,
    publicParam,
    [],
  );
  const startTime = parseStartTime(t ?? start ?? time_continue) * 1000;
  const shouldAutoplay = autoplay === 1;

  if (instancePending) return <EmbedLoading />;

  if (instanceError || !instance)
    return (
      <EmbedError message={m.ui_could_not_load_player()} onRetry={() => void retryInstance()} />
    );

  if (!guestAllowed && !access.accountAuthenticated)
    return <EmbedGuestRequired watchUrl={watchUrl} />;

  const pending = streamQuery.isLoading || bootstrap.isLoading;
  if (!activeStream && (!access.streamEnabled || pending)) return <EmbedLoading />;

  if (!activeStream) {
    const activeError = streamQuery.error ?? bootstrap.error;
    const genericExtractorError =
      activeError instanceof ApiError &&
      activeError.status === 422 &&
      activeError.message ===
        m.ui_error_occurs_when_fetching_the_page_try_increase_the_loading_timeout();
    const availability = genericExtractorError
      ? "members_only"
      : resolveVideoAvailability(activeError);
    const youtubeSessionAction = youtubeSessionActionForError(activeError);
    const needsYoutubeSession = youtubeSessionAction !== null;
    const familyListBlocked = isChannelNotAllowedError(activeError);
    const focusBlock = parseFocusBlockError(activeError);
    const streamErrorMessage = isStreamUnavailableError(activeError)
      ? m.ui_this_video_is_currently_unavailable()
      : resolveStreamErrorMessage(activeError);
    const message = availability
      ? videoAvailabilityCopy(
          availability,
          activeError instanceof Error ? activeError.message : undefined,
        ).message
      : familyListBlocked
        ? familyListBlockedMessage()
        : focusBlock
          ? focusBlock.code === "focus_entertainment_blocked"
            ? m.focus_blocked_entertainment()
            : m.focus_blocked_outside_study()
          : needsYoutubeSession
            ? youtubeSessionAction === "reconnect"
              ? m.ui_reconnect_youtube_to_access_this_video()
              : m.ui_connect_youtube_to_access_this_video()
            : (streamErrorMessage ?? m.ui_failed_to_load_stream());
    return (
      <EmbedError
        message={message}
        familyListBlocked={familyListBlocked}
        focusBlocked={Boolean(focusBlock)}
        availability={availability ?? undefined}
        poster={availabilityPoster}
        watchUrl={needsYoutubeSession ? watchUrl : undefined}
        onRetry={
          availability || needsYoutubeSession || familyListBlocked || focusBlock
            ? undefined
            : () => {
                void streamQuery.refetch();
                void bootstrap.refetch();
              }
        }
      />
    );
  }

  if (activeStream.requiresMembership) {
    return (
      <EmbedError
        message={videoAvailabilityCopy("members_only").message}
        availability="members_only"
        poster={activeStream.thumbnail}
      />
    );
  }

  return (
    <EmbedPlayerShell
      stream={activeStream}
      sourceUrl={sourceUrl}
      startTime={startTime}
      autoplay={shouldAutoplay}
      sessionEnabled={access.sessionEnabled}
    />
  );
}

export const Route = createFileRoute("/embed_/$videoId")({
  validateSearch: (search: Record<string, unknown>): EmbedSearch => ({
    t: typeof search.t === "string" || typeof search.t === "number" ? search.t : undefined,
    start:
      typeof search.start === "string" || typeof search.start === "number"
        ? search.start
        : undefined,
    time_continue:
      typeof search.time_continue === "string" || typeof search.time_continue === "number"
        ? search.time_continue
        : undefined,
    autoplay: typeof search.autoplay === "number" ? search.autoplay : undefined,
  }),
  component: EmbedPage,
});
