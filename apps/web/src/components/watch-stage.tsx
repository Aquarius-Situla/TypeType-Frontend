import { useAdBreak } from "../hooks/use-ad-break";
import { usePersistentWatchPlayer } from "../hooks/use-persistent-watch-player";
import { detectProvider } from "../lib/provider";
import { PageSpinner } from "./page-spinner";
import { PlayerError } from "./player-error";
import { WatchMeta } from "./watch-meta";
import { WatchStageOverlays } from "./watch-stage-overlays";
import type { WatchStagePlayerProps } from "./watch-stage-player";
import type { WatchStageProps } from "./watch-stage-props";

export function WatchStage({
  classes,
  stream,
  settings,
  manifestSrc,
  sabrConfig,
  audioOnly,
  playerKey,
  sabrRetryKey,
  startTime,
  seekIntervalSeconds,
  isLive,
  settingsReady,
  autoplay,
  navigating,
  originalLocale,
  overlay,
  autoplayState,
  sponsorBlockSegments,
  autoSkipSegments,
  manualSkipSegments,
  thumbnailVtt,
  chaptersVtt,
  playerFailed,
  cinemaMode,
  webFullscreen = false,
  hideComments,
  mobilePanel,
  mobileSecondaryContent,
  seekRef,
  audioOnlyControls,
  onCaptionStylesChange,
  onVolumeChange,
  onTimeUpdate,
  onPlay,
  onPause,
  onSeeking,
  onSeeked,
  onEnded,
  onAutoplayPlayNow,
  onAutoplayCancel,
  onAutoplayPauseToggle,
  onPositionReaderChange,
  onPreviousVideo,
  onNextVideo,
  onError,
  onReset,
}: WatchStageProps) {
  const adBreak = useAdBreak(stream.id, !isLive && !audioOnly);
  const playerOverlay = (
    <WatchStageOverlays
      streamId={stream.id}
      overlay={overlay}
      adBreak={adBreak}
      resume={autoplay}
      autoplayState={autoplayState}
      onAutoplayPlayNow={onAutoplayPlayNow}
      onAutoplayCancel={onAutoplayCancel}
      onAutoplayPauseToggle={onAutoplayPauseToggle}
    />
  );
  const playerProps: WatchStagePlayerProps = {
    audioOnly,
    streamTitle: stream.title,
    poster: stream.thumbnail,
    playerKey,
    sabrRetryKey,
    manifestSrc,
    provider: detectProvider(stream.id),
    sabrConfig,
    isLive,
    startTime,
    seekIntervalSeconds,
    subtitles: stream.subtitles,
    sponsorBlockSegments,
    autoSkipSegments,
    manualSkipSegments,
    settings,
    settingsReady,
    autoplay: autoplay && !adBreak.ad,
    originalLocale,
    overlay: playerOverlay,
    seekRef,
    thumbnailVtt,
    chaptersVtt,
    playerClassName: classes.playerClassName,
    mediaClassName: classes.mediaClassName,
    onCaptionStylesChange,
    onVolumeChange,
    onTimeUpdate,
    onPlay,
    onPause,
    onSeeking,
    onSeeked,
    onError,
    onPositionReaderChange,
    onEnded,
    onPreviousVideo,
    onNextVideo,
  };
  const persistent = usePersistentWatchPlayer(stream.id, playerProps, !navigating && !playerFailed);
  const localPlayer = navigating ? (
    <div className="flex aspect-video w-full items-center justify-center bg-black">
      <PageSpinner fullScreen={false} />
    </div>
  ) : playerFailed ? (
    <div className="flex aspect-video w-full items-center justify-center bg-black">
      <PlayerError onRetry={onReset} />
    </div>
  ) : (
    <div aria-hidden="true" className="aspect-video h-full w-full bg-black" />
  );

  return (
    <div className={classes.playerWrapClass}>
      <div ref={persistent.anchorRef} className={classes.playerBoxClass}>
        {localPlayer}
      </div>
      {mobilePanel && !webFullscreen ? <div className="mt-4">{mobilePanel}</div> : null}
      {!cinemaMode && !webFullscreen && (
        <WatchMeta
          stream={stream}
          showComments={!hideComments}
          onSeekTimestamp={(seconds) => seekRef.current?.(seconds)}
          audioOnly={audioOnlyControls}
        />
      )}
      {mobileSecondaryContent && !webFullscreen ? (
        <div className="mt-6">{mobileSecondaryContent}</div>
      ) : null}
    </div>
  );
}
