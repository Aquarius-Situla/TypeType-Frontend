import { Suspense } from "react";
import type { SabrPlaybackRatePreference } from "../lib/sabr-playback-rate-preference";
import type { VideoJsSource } from "../lib/video-js-source";
import { LazyVideoJsVideoPlayer } from "./lazy-videojs-video-player";
import { LoadingMascot } from "./loading-mascot";
import type { ShortsVideoPlayerProps } from "./shorts-video-player";
import { VideoJsTrackDefaults } from "./videojs-watch-defaults";

type Props = ShortsVideoPlayerProps & {
  source: VideoJsSource;
  playbackRate: SabrPlaybackRatePreference;
  onOriginalLanguageUnavailable: () => void;
};

export function VideoJsShortsPlayer(props: Props) {
  return (
    <Suspense fallback={<LoadingMascot variant="video-portrait" surface="fill" />}>
      <LazyVideoJsVideoPlayer
        source={props.source}
        src={props.src ?? ""}
        sabrConfig={props.config}
        sabrPlaybackRatePreference={props.playbackRate}
        layoutMode="shorts"
        title={props.title}
        poster={props.poster}
        subtitles={props.subtitles}
        initialVolume={props.initialVolume}
        initialMuted={props.initialMuted}
        settingsReady={props.settingsReady}
        autoplay={props.autoplay ?? true}
        defaultPlaybackSpeed={props.defaultPlaybackSpeed}
        className="shorts-video-player h-full w-full"
        mediaClassName="shorts-video-media"
        overlay={
          <VideoJsTrackDefaults
            audio={{
              forceOriginal: true,
              originalId: props.originalAudioTrackId,
              preferredId: props.preferredDefaultAudioTrackId,
              originalLocale: props.originalAudioLocale,
              preferredLanguage: props.defaultAudioLanguage,
            }}
            subtitlesEnabled={props.subtitlesEnabled ?? false}
            subtitleLanguage={props.defaultSubtitleLanguage}
            onOriginalLanguageUnavailable={props.onOriginalLanguageUnavailable}
          />
        }
        onVolumeChange={props.onVolumeChange}
        onError={props.onError}
        onEnded={props.onEnded}
      />
    </Suspense>
  );
}
