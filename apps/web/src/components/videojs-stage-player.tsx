import { Suspense } from "react";
import type { SabrPlaybackRatePreference } from "../lib/sabr-playback-rate-preference";
import type { VideoJsSource } from "../lib/video-js-source";
import { LazyVideoJsVideoPlayer } from "./lazy-videojs-video-player";
import { LoadingMascot } from "./loading-mascot";
import type { WatchStagePlayerProps } from "./watch-stage-player";

type Props = WatchStagePlayerProps & {
  source: VideoJsSource;
  playbackRatePreference?: SabrPlaybackRatePreference;
};

export function VideoJsStagePlayer(props: Props) {
  return (
    <Suspense fallback={<LoadingMascot variant="video-landscape" surface="fill" />}>
      <LazyVideoJsVideoPlayer
        key={props.playerKey}
        source={props.source}
        provider={props.provider}
        audioOnly={props.audioOnly}
        sabrConfig={props.sabrConfig}
        sabrRetryKey={props.sabrRetryKey}
        sabrPlaybackRatePreference={props.playbackRatePreference}
        defaultPlaybackSpeed={props.settings.defaultPlaybackSpeed}
        ownSkin={props.ownSkin}
        overlay={props.overlay}
        src={props.manifestSrc}
        title={props.streamTitle}
        poster={props.poster}
        streamType={props.isLive ? "live" : "on-demand"}
        liveRecording={props.liveRecording}
        startTime={props.startTime}
        subtitles={props.subtitles}
        sponsorBlockSegments={props.sponsorBlockSegments}
        autoSkipSponsorBlock={Boolean(props.autoSkipSegments)}
        autoSkipSponsorBlockSegments={props.autoSkipSegments}
        manualSkipSponsorBlockSegments={props.manualSkipSegments}
        muteSponsorBlockInsteadOfSkip={props.settings.sponsorBlockMuteInsteadOfSkip}
        showCurrentSponsorBlockSegment={props.settings.sponsorBlockShowCurrentSegment}
        onPreviousVideo={props.onPreviousVideo}
        onNextVideo={props.onNextVideo}
        thumbnailVtt={props.thumbnailVtt}
        captionStyles={props.settings.captionStyles}
        onCaptionStylesChange={props.onCaptionStylesChange}
        chaptersVtt={props.chaptersVtt}
        initialVolume={props.settings.volume}
        initialMuted={props.settings.muted}
        settingsReady={props.settingsReady}
        autoplay={props.autoplay}
        onVolumeChange={props.onVolumeChange}
        onTimeUpdate={props.onTimeUpdate}
        onPlay={props.onPlay}
        onPause={props.onPause}
        onSeeking={props.onSeeking}
        onSeeked={props.onSeeked}
        onError={props.onError}
        onEnded={props.onEnded}
        onPositionReaderChange={props.onPositionReaderChange}
        onSeekReady={(seek) => {
          props.seekRef.current = seek;
        }}
        className={props.playerClassName}
        mediaClassName={props.mediaClassName}
      />
    </Suspense>
  );
}
