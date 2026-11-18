import { useEffect, useRef, useState } from "react";
import { useSettings } from "../hooks/use-settings";
import { SabrPlaybackRatePreference } from "../lib/sabr-playback-rate-preference";
import type { SabrPlaybackConfig } from "../lib/sabr-source";
import { sabrMediaSrc } from "../lib/sabr-vidstack-loader";
import { videoJsSourceFor } from "../lib/video-js-source";
import type { MediaSrc } from "../lib/vidstack";
import { m } from "../paraglide/messages.js";
import type { SubtitleItem } from "../types/api";
import { PlayerDefaults, PlayerPlaybackSpeedDefault } from "./player-defaults";
import { Toast } from "./toast";
import { VideoPlayer } from "./video-player";
import { VideoJsShortsPlayer } from "./videojs-shorts-player";

type PlaybackProps = { config: SabrPlaybackConfig; src?: never } | { config?: null; src: MediaSrc };

export type ShortsVideoPlayerProps = PlaybackProps & {
  title?: string;
  poster?: string;
  subtitles?: SubtitleItem[];
  initialVolume?: number;
  initialMuted?: boolean;
  settingsReady?: boolean;
  autoplay?: boolean;
  defaultAudioLanguage?: string;
  defaultPlaybackSpeed?: number;
  preferOriginalLanguage?: boolean;
  originalAudioTrackId?: string | null;
  preferredDefaultAudioTrackId?: string | null;
  originalAudioLocale?: string | null;
  defaultSubtitleLanguage?: string;
  subtitlesEnabled?: boolean;
  onVolumeChange?: (volume: number, muted: boolean) => void;
  onError?: () => void;
  onEnded?: () => void;
};

export function ShortsVideoPlayer({
  config,
  src,
  title,
  poster,
  subtitles,
  initialVolume = 1,
  initialMuted = false,
  settingsReady = false,
  autoplay = true,
  defaultAudioLanguage,
  defaultPlaybackSpeed = 1,
  preferOriginalLanguage,
  originalAudioTrackId,
  preferredDefaultAudioTrackId,
  originalAudioLocale,
  defaultSubtitleLanguage,
  subtitlesEnabled,
  onVolumeChange,
  onError,
  onEnded,
}: ShortsVideoPlayerProps) {
  const [toast, setToast] = useState<string | null>(null);
  const { settings } = useSettings();
  const videoJs = videoJsSourceFor({
    engine: settings.playerEngine,
    source: src,
    sabr: Boolean(config),
    audioOnly: false,
  });
  const playbackRate = useRef(new SabrPlaybackRatePreference(defaultPlaybackSpeed));

  useEffect(() => {
    playbackRate.current.setPreferredRate(defaultPlaybackSpeed);
  }, [defaultPlaybackSpeed]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  if (videoJs) {
    return (
      <div className="absolute inset-0 bg-black">
        <VideoJsShortsPlayer
          {...(config ? { config } : { src: src as MediaSrc })}
          source={videoJs}
          playbackRate={playbackRate.current}
          title={title}
          poster={poster}
          subtitles={subtitles}
          initialVolume={initialVolume}
          initialMuted={initialMuted}
          settingsReady={settingsReady}
          autoplay={autoplay}
          defaultAudioLanguage={defaultAudioLanguage}
          defaultPlaybackSpeed={defaultPlaybackSpeed}
          originalAudioTrackId={originalAudioTrackId}
          preferredDefaultAudioTrackId={preferredDefaultAudioTrackId}
          originalAudioLocale={originalAudioLocale}
          defaultSubtitleLanguage={defaultSubtitleLanguage}
          subtitlesEnabled={subtitlesEnabled}
          onVolumeChange={onVolumeChange}
          onError={onError}
          onEnded={onEnded}
          onOriginalLanguageUnavailable={() => setToast(m.ui_original_audio_unavailable())}
        />
        <Toast message={toast} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black">
      <VideoPlayer
        src={config ? sabrMediaSrc(config.videoId) : src}
        sabrConfig={config}
        sabrPlaybackRatePreference={playbackRate.current}
        layoutMode="shorts"
        hideCinemaMode
        title={title}
        poster={poster}
        subtitles={subtitles}
        initialVolume={initialVolume}
        initialMuted={initialMuted}
        settingsReady={settingsReady}
        autoplay={autoplay}
        originalAudioLocale={originalAudioLocale}
        className="shorts-video-player"
        mediaClassName="shorts-video-media"
        overlay={
          <>
            <PlayerDefaults
              defaultAudioLanguage={defaultAudioLanguage}
              preferOriginalLanguage={preferOriginalLanguage}
              requireOriginalLanguage
              onOriginalLanguageUnavailable={() => setToast(m.ui_original_audio_unavailable())}
              originalAudioTrackId={originalAudioTrackId}
              preferredDefaultAudioTrackId={preferredDefaultAudioTrackId}
              originalAudioLocale={originalAudioLocale}
              defaultSubtitleLanguage={defaultSubtitleLanguage}
              subtitlesEnabled={subtitlesEnabled}
            />
            <PlayerPlaybackSpeedDefault
              defaultPlaybackSpeed={defaultPlaybackSpeed}
              preference={playbackRate.current}
            />
          </>
        }
        onVolumeChange={onVolumeChange}
        onError={onError}
        onEnded={onEnded}
      />
      <Toast message={toast} />
    </div>
  );
}
