import { useState } from "react";
import { useSabrPlaybackConfig } from "../hooks/use-sabr-playback-config";
import { detectProvider } from "../lib/provider";
import { shortsPlaybackSourceKind, shortsPlaybackState } from "../lib/shorts-playback-state";
import { resolveManifestSrc } from "../lib/stream-src";
import { m } from "../paraglide/messages.js";
import { LoadingMascot } from "./loading-mascot";
import { ShortsActions } from "./shorts-actions";
import { ShortsCommentsSheetSlot } from "./shorts-comments-sheet-slot";
import { ShortsError } from "./shorts-error";
import { ShortsInfoOverlay } from "./shorts-info-overlay";
import { ShortsNavigation } from "./shorts-navigation";
import type { ShortsPlayerStageProps } from "./shorts-player-stage-types";
import { ShortsVideoPlayer } from "./shorts-video-player";

export function ShortsPlayerStage({
  sectionClass,
  playerRef,
  commentsOpen,
  active,
  current,
  stream,
  streamLoading,
  streamError,
  errorMessage,
  isMemberOnlyShort,
  youtubeSessionAction,
  youtubeSessionReturnTo,
  hasPrev,
  hasNext,
  settingsReady,
  autoplay,
  initialVolume,
  initialMuted,
  defaultQuality,
  defaultPlaybackSpeed,
  defaultAudioLanguage,
  preferOriginalLanguage,
  originalAudioTrackId,
  preferredDefaultAudioTrackId,
  originalAudioLocale,
  defaultSubtitleLanguage,
  subtitlesEnabled,
  showComments,
  onOpenComments,
  onCloseComments,
  onRetry,
  onNext,
  onAutoNext,
  onPrev,
  onWheel,
  onTouchStart,
  onTouchEnd,
  onVolumeChange,
}: ShortsPlayerStageProps) {
  const [playbackError, setPlaybackError] = useState(false);
  const [playbackAttempt, setPlaybackAttempt] = useState(0);
  const provider = detectProvider(stream?.id ?? current.id);
  const youtube = provider === "youtube";
  const sabrConfig = useSabrPlaybackConfig(
    stream ?? current,
    youtube && Boolean(stream),
    defaultQuality,
    defaultAudioLanguage,
    preferOriginalLanguage,
  );
  const manifestSrc =
    stream && !youtube
      ? resolveManifestSrc(stream, false, false, {
          compactAudioTracks: true,
          preferredAudioLanguage: preferOriginalLanguage ? undefined : defaultAudioLanguage,
          preferOriginalLanguage,
          maxCompactAudioTracks: 3,
        })
      : null;
  const sourceKind = shortsPlaybackSourceKind(provider, Boolean(sabrConfig), Boolean(manifestSrc));
  const playbackProps =
    sourceKind === "sabr" && sabrConfig
      ? { config: sabrConfig }
      : sourceKind === "manifest" && manifestSrc
        ? { src: manifestSrc }
        : null;
  const state = shortsPlaybackState({
    loading: streamLoading,
    queryError: streamError,
    hasStream: Boolean(stream),
    hasPlaybackSource: sourceKind !== null,
    playbackError,
  });

  function retry() {
    setPlaybackError(false);
    setPlaybackAttempt((attempt) => attempt + 1);
    onRetry();
  }

  const playbackMessage =
    state === "source-unavailable"
      ? youtube
        ? m.ui_sabr_playback_is_unavailable_for_this_short()
        : m.ui_playback_unavailable_for_short()
      : state === "playback-error"
        ? m.ui_this_short_stopped_playing()
        : isMemberOnlyShort
          ? m.ui_this_short_is_only_available_for_members()
          : errorMessage;

  return (
    <section className={sectionClass}>
      <div className="flex h-full min-h-0 w-full items-center justify-center">
        <div className="shorts-stage relative max-h-full max-w-full">
          <div
            ref={playerRef}
            className="shorts-shell shorts-frame relative overflow-hidden rounded-lg bg-black shadow-xl"
            onWheel={(event) => !commentsOpen && onWheel(event)}
            onTouchStart={(event) =>
              !commentsOpen && onTouchStart(event.touches[0]?.clientY ?? null, event.target)
            }
            onTouchEnd={(event) =>
              !commentsOpen && onTouchEnd(event.changedTouches[0]?.clientY ?? null, event.target)
            }
          >
            {state === "loading" && (
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <LoadingMascot variant="video-portrait" surface="fill" />
              </div>
            )}
            {state !== "loading" && state !== "ready" && (
              <ShortsError
                message={playbackMessage}
                onRetry={retry}
                onNext={onNext}
                youtubeSessionAction={youtubeSessionAction}
                youtubeSessionReturnTo={youtubeSessionReturnTo}
              />
            )}
            {stream && playbackProps && state === "ready" && (
              <ShortsVideoPlayer
                key={`${sabrConfig?.key ?? stream.id}:${playbackAttempt}`}
                {...playbackProps}
                title={stream.title}
                poster={stream.thumbnail}
                subtitles={stream.subtitles}
                initialVolume={initialVolume}
                initialMuted={initialMuted}
                defaultPlaybackSpeed={defaultPlaybackSpeed}
                settingsReady={settingsReady}
                autoplay={autoplay}
                defaultAudioLanguage={defaultAudioLanguage}
                preferOriginalLanguage={preferOriginalLanguage}
                originalAudioTrackId={originalAudioTrackId}
                preferredDefaultAudioTrackId={preferredDefaultAudioTrackId}
                originalAudioLocale={originalAudioLocale}
                defaultSubtitleLanguage={defaultSubtitleLanguage}
                subtitlesEnabled={subtitlesEnabled}
                onVolumeChange={onVolumeChange}
                onError={() => setPlaybackError(true)}
                onEnded={onAutoNext}
              />
            )}
            {current.title && (
              <div className="pointer-events-none">
                <ShortsInfoOverlay stream={current} />
              </div>
            )}
            {current.title && (
              <ShortsActions
                stream={current}
                onOpenComments={onOpenComments}
                showComments={showComments}
                className="absolute bottom-24 right-2 z-30 lg:hidden"
                compact
              />
            )}
          </div>
          <div className="absolute bottom-3 left-full ml-4 hidden flex-col items-center gap-4 lg:flex">
            {current.title && (
              <ShortsActions
                stream={current}
                onOpenComments={onOpenComments}
                showComments={showComments}
              />
            )}
            <ShortsNavigation onPrev={onPrev} onNext={onNext} hasPrev={hasPrev} hasNext={hasNext} />
          </div>
        </div>
      </div>
      {showComments && (
        <ShortsCommentsSheetSlot
          videoUrl={active.id}
          anchorEl={playerRef.current}
          open={commentsOpen}
          onClose={onCloseComments}
        />
      )}
    </section>
  );
}
