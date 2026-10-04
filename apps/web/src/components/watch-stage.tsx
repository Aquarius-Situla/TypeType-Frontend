import { type MutableRefObject, type ReactNode, useLayoutEffect, useRef } from "react";
import { usePersistentWatchPlayer } from "../hooks/use-persistent-watch-player";
import type { WatchAudioOnlyControls } from "../hooks/use-watch-audio-only-playback";
import type { AutoplayState } from "../hooks/use-watch-ended-navigation";
import type { SabrPlaybackConfig } from "../lib/sabr-source";
import type { MediaSrc } from "../lib/vidstack";
import { resolveWatchPlayerStartTime } from "../lib/watch-player-position";
import type { SponsorBlockSegmentItem } from "../types/api";
import type { VideoStream } from "../types/stream";
import type { CaptionStyles, SettingsItem } from "../types/user";
import { AutoplayCountdownOverlay } from "./autoplay-countdown-overlay";
import { PageSpinner } from "./page-spinner";
import { PlayerError } from "./player-error";
import type { WatchLayoutClasses } from "./watch-layout-classes";
import { WatchMeta } from "./watch-meta";
import { WatchStagePlayer } from "./watch-stage-player";

type Props = {
  classes: WatchLayoutClasses;
  stream: VideoStream;
  settings: SettingsItem;
  manifestSrc: MediaSrc;
  sabrConfig: SabrPlaybackConfig | null;
  audioOnly: boolean;
  playerKey: string;
  startTime: number;
  seekIntervalSeconds?: number;
  isLive: boolean;
  settingsReady: boolean;
  autoplay: boolean;
  navigating: boolean;
  originalLocale: string | null;
  overlay: ReactNode;
  autoplayState: AutoplayState | null;
  sponsorBlockSegments?: SponsorBlockSegmentItem[];
  autoSkipSegments?: SponsorBlockSegmentItem[];
  manualSkipSegments?: SponsorBlockSegmentItem[];
  thumbnailVtt?: string;
  chaptersVtt?: string;
  playerFailed: boolean;
  cinemaMode: boolean;
  webFullscreen?: boolean;
  hideComments: boolean;
  mobilePanel: ReactNode;
  mobileSecondaryContent: ReactNode | null;
  seekRef: MutableRefObject<((seconds: number) => void) | null>;
  audioOnlyControls: WatchAudioOnlyControls;
  onCaptionStylesChange: (styles: CaptionStyles) => void;
  onVolumeChange: (volume: number, muted: boolean) => void;
  onTimeUpdate: (positionMs: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onSeeking: (positionMs: number) => void;
  onSeeked: () => void;
  onEnded: () => void;
  onAutoplayPlayNow: () => void;
  onAutoplayCancel: () => void;
  onAutoplayPauseToggle: () => void;
  onPositionReaderChange: (reader: (() => number | null) | null) => void;
  onPreviousVideo?: () => void;
  onNextVideo?: () => void;
  onError: (positionMs?: number) => void;
  onReset: () => void;
};

export function WatchStage({
  classes,
  stream,
  settings,
  manifestSrc,
  sabrConfig,
  audioOnly,
  playerKey,
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
}: Props) {
  const playerPositionRef = useRef(startTime);
  const playerStartTimeRef = useRef(startTime);
  const playerKeyRef = useRef(playerKey);
  const cinemaModeRef = useRef(cinemaMode);
  const webFullscreenRef = useRef(webFullscreen);
  const sourceChanged = playerKeyRef.current !== playerKey;
  const cinemaModeChanged = cinemaModeRef.current !== cinemaMode;
  const webFullscreenChanged = webFullscreenRef.current !== webFullscreen;
  const layoutChanged = (cinemaModeChanged || webFullscreenChanged) && !sourceChanged;

  if (sourceChanged) {
    playerKeyRef.current = playerKey;
    playerPositionRef.current = startTime;
    playerStartTimeRef.current = startTime;
  }

  const playerStartTime = resolveWatchPlayerStartTime(
    playerStartTimeRef.current,
    playerPositionRef.current,
    layoutChanged,
  );

  useLayoutEffect(() => {
    cinemaModeRef.current = cinemaMode;
    webFullscreenRef.current = webFullscreen;
    if (layoutChanged) {
      playerStartTimeRef.current = playerPositionRef.current;
    }
  }, [cinemaMode, webFullscreen, layoutChanged]);

  const handleTimeUpdate = (positionMs: number) => {
    playerPositionRef.current = Math.max(0, positionMs);
    onTimeUpdate(positionMs);
  };
  const handleSeeking = (positionMs: number) => {
    playerPositionRef.current = Math.max(0, positionMs);
    onSeeking(positionMs);
  };
  const playerOverlay = (
    <>
      {overlay}
      {autoplayState && (
        <AutoplayCountdownOverlay
          target={autoplayState.target}
          totalSeconds={autoplayState.totalSeconds}
          paused={autoplayState.paused}
          onPlayNow={onAutoplayPlayNow}
          onCancel={onAutoplayCancel}
          onPauseToggle={onAutoplayPauseToggle}
        />
      )}
    </>
  );
  const playerProps = {
    audioOnly,
    streamTitle: stream.title,
    poster: stream.thumbnail,
    playerKey,
    manifestSrc,
    sabrConfig,
    isLive,
    startTime: playerStartTime,
    seekIntervalSeconds,
    subtitles: stream.subtitles,
    sponsorBlockSegments,
    autoSkipSegments,
    manualSkipSegments,
    settings,
    settingsReady,
    autoplay,
    originalLocale,
    overlay: playerOverlay,
    seekRef,
    thumbnailVtt,
    chaptersVtt,
    playerClassName: classes.playerClassName,
    mediaClassName: classes.mediaClassName,
    onCaptionStylesChange,
    onVolumeChange,
    onTimeUpdate: handleTimeUpdate,
    onPlay,
    onPause,
    onSeeking: handleSeeking,
    onSeeked,
    onError,
    onPositionReaderChange,
    onEnded,
    onPreviousVideo,
    onNextVideo,
  };
  const persistent = usePersistentWatchPlayer(
    stream.id,
    playerProps,
    !cinemaMode && !webFullscreen && !navigating && !playerFailed,
  );
  const localPlayer = navigating ? (
    <div className="flex aspect-video w-full items-center justify-center bg-black">
      <PageSpinner fullScreen={false} />
    </div>
  ) : playerFailed ? (
    <div className="flex aspect-video w-full items-center justify-center bg-black">
      <PlayerError onRetry={onReset} />
    </div>
  ) : (
    <WatchStagePlayer {...playerProps} />
  );

  return (
    <div className={classes.playerWrapClass}>
      <div ref={persistent.anchorRef} className={classes.playerBoxClass}>
        {cinemaMode || webFullscreen || navigating || playerFailed ? (
          localPlayer
        ) : (
          <div aria-hidden="true" className="aspect-video w-full bg-black" />
        )}
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
