import { lazy, type MutableRefObject, type ReactNode, Suspense, useEffect, useRef } from "react";
import { useEngineHandoff } from "../hooks/use-engine-handoff";
import type { Provider } from "../lib/provider";
import { SabrPlaybackRatePreference } from "../lib/sabr-playback-rate-preference";
import type { SabrPlaybackConfig } from "../lib/sabr-source";
import { videoJsSourceFor } from "../lib/video-js-source";
import type { MediaSrc } from "../lib/vidstack";
import { usePlaybackRateStore } from "../stores/playback-rate-store";
import type { SponsorBlockSegmentItem, SubtitleItem } from "../types/api";
import type { CaptionStyles, SettingsItem } from "../types/user";
import { VideoJsStagePlayer } from "./videojs-stage-player";

// Video.js is the default engine: the Vidstack player and its controls only load for those who chose it.
const VidstackStagePlayer = lazy(() => import("./vidstack-stage-player"));

export type WatchStagePlayerProps = {
  audioOnly: boolean;
  streamTitle: string;
  poster?: string;
  playerKey: string;
  sabrRetryKey: number;
  manifestSrc: MediaSrc;
  provider: Provider;
  sabrConfig: SabrPlaybackConfig | null;
  isLive: boolean;
  liveRecording?: boolean;
  startTime: number;
  seekIntervalSeconds?: number;
  subtitles?: SubtitleItem[];
  sponsorBlockSegments?: SponsorBlockSegmentItem[];
  autoSkipSegments?: SponsorBlockSegmentItem[];
  manualSkipSegments?: SponsorBlockSegmentItem[];
  settings: SettingsItem;
  settingsReady: boolean;
  autoplay: boolean;
  originalLocale: string | null;
  overlay: ReactNode;
  seekRef: MutableRefObject<((seconds: number) => void) | null>;
  thumbnailVtt?: string;
  chaptersVtt?: string;
  playerClassName?: string;
  mediaClassName?: string;
  ownSkin?: boolean;
  onCaptionStylesChange: (styles: CaptionStyles) => void;
  onVolumeChange: (volume: number, muted: boolean) => void;
  onTimeUpdate: (positionMs: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onSeeking: (positionMs: number) => void;
  onSeeked: () => void;
  onError: (positionMs?: number) => void;
  onPositionReaderChange: (reader: (() => number | null) | null) => void;
  onEnded: () => void;
  onPreviousVideo?: () => void;
  onNextVideo?: () => void;
};

export function WatchStagePlayer(props: WatchStagePlayerProps) {
  const settings = props.settings;
  const playbackRatePreference = useRef<SabrPlaybackRatePreference | null>(null);
  playbackRatePreference.current ??= new SabrPlaybackRatePreference(
    usePlaybackRateStore.getState().chosenRate ?? settings.defaultPlaybackSpeed,
    usePlaybackRateStore.getState().choose,
  );
  useEffect(() => {
    if (usePlaybackRateStore.getState().syncDefault(settings.defaultPlaybackSpeed)) {
      playbackRatePreference.current?.setPreferredRate(settings.defaultPlaybackSpeed);
    }
  }, [settings.defaultPlaybackSpeed]);
  // An own skin exists only in Video.js: Twitch plays there whatever the engine setting says.
  const engine = props.ownSkin ? "videojs" : settings.playerEngine;
  const handoff = useEngineHandoff(
    engine,
    props.playerKey,
    props.isLive ? 0 : props.startTime,
    props.onTimeUpdate,
  );
  const startTime = props.isLive ? props.startTime : handoff.startTime;
  const videoJs = videoJsSourceFor({
    engine,
    source: props.manifestSrc,
    sabr: Boolean(props.sabrConfig),
    audioOnly: props.audioOnly,
  });
  if (videoJs)
    return (
      <VideoJsStagePlayer
        {...props}
        startTime={startTime}
        onTimeUpdate={handoff.onTimeUpdate}
        source={videoJs}
        playbackRatePreference={playbackRatePreference.current}
      />
    );
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-full w-full bg-black" />}>
      <VidstackStagePlayer
        {...props}
        startTime={startTime}
        onTimeUpdate={handoff.onTimeUpdate}
        playbackRatePreference={playbackRatePreference.current}
      />
    </Suspense>
  );
}
