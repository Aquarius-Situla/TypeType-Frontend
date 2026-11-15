import { Suspense } from "react";
import type { SabrPlaybackRatePreference } from "../lib/sabr-playback-rate-preference";
import type { VideoJsSource } from "../lib/video-js-source";
import { LazyVideoJsVideoPlayer } from "./lazy-videojs-video-player";
import type { ShortsVideoPlayerProps } from "./shorts-video-player";
import { VideoJsTrackDefaults } from "./videojs-watch-defaults";

type Props = ShortsVideoPlayerProps & {
  source: VideoJsSource;
  playbackRate: SabrPlaybackRatePreference;
  onOriginalLanguageUnavailable: () => void;
};

export function VideoJsShortsPlayer(props: Props) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-full w-full bg-black" />}>
      <LazyVideoJsVideoPlayer
        source={props.source}
        src={props.src ?? ""}
        sabrConfig={props.config}
        sabrPlaybackRatePreference={props.playbackRate}
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
