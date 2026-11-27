import { useState } from "react";
import type { SabrPlaybackRatePreference } from "../lib/sabr-playback-rate-preference";
import { PlayerPlaybackSpeedDefault } from "./player-defaults";
import { VideoPlayer } from "./video-player";
import { WatchPlayerCrossfade } from "./watch-player-crossfade";
import type { WatchStagePlayerProps } from "./watch-stage-player";

type Props = WatchStagePlayerProps & {
  startTime: number;
  onTimeUpdate: (positionMs: number) => void;
  playbackRatePreference: SabrPlaybackRatePreference;
};

export default function VidstackStagePlayer({
  startTime,
  onTimeUpdate,
  playbackRatePreference,
  ...props
}: Props) {
  const settings = props.settings;
  const [audioPosterVisible, setAudioPosterVisible] = useState(props.audioOnly);
  return (
    <WatchPlayerCrossfade
      audioOnly={audioPosterVisible}
      poster={props.poster}
      title={props.streamTitle}
    >
      <VideoPlayer
        key={props.playerKey}
        src={props.manifestSrc}
        provider={props.provider}
        sabrConfig={props.sabrConfig}
        sabrRetryKey={props.sabrRetryKey}
        sabrPlaybackRatePreference={playbackRatePreference}
        audioOnly={props.audioOnly}
        title={props.streamTitle}
        poster={props.poster}
        streamType={props.isLive ? "live" : "on-demand"}
        startTime={startTime}
        seekIntervalSeconds={props.seekIntervalSeconds}
        subtitles={props.subtitles}
        sponsorBlockSegments={props.sponsorBlockSegments}
        autoSkipSponsorBlock={Boolean(props.autoSkipSegments)}
        autoSkipSponsorBlockSegments={props.autoSkipSegments}
        manualSkipSponsorBlockSegments={props.manualSkipSegments}
        muteSponsorBlockInsteadOfSkip={settings.sponsorBlockMuteInsteadOfSkip}
        showCurrentSponsorBlockSegment={settings.sponsorBlockShowCurrentSegment}
        thumbnailVtt={props.thumbnailVtt}
        chaptersVtt={props.chaptersVtt}
        initialVolume={settings.volume}
        initialMuted={settings.muted}
        settingsReady={props.settingsReady}
        autoplay={props.autoplay}
        originalAudioLocale={props.originalLocale}
        overlay={
          <>
            <PlayerPlaybackSpeedDefault
              defaultPlaybackSpeed={settings.defaultPlaybackSpeed}
              preference={playbackRatePreference}
              rememberChanges={!props.sabrConfig}
            />
            {props.overlay}
          </>
        }
        captionStyles={settings.captionStyles}
        onCaptionStylesChange={props.onCaptionStylesChange}
        onVolumeChange={props.onVolumeChange}
        onTimeUpdate={onTimeUpdate}
        onPlay={props.onPlay}
        onPause={props.onPause}
        onSeeking={props.onSeeking}
        onSeeked={props.onSeeked}
        onError={props.onError}
        onPositionReaderChange={props.onPositionReaderChange}
        onEnded={props.onEnded}
        onPreviousVideo={props.onPreviousVideo}
        onNextVideo={props.onNextVideo}
        onAudioPosterChange={setAudioPosterVisible}
        onSeekReady={(seek) => (props.seekRef.current = seek)}
        className={props.playerClassName}
        mediaClassName={props.mediaClassName}
      />
    </WatchPlayerCrossfade>
  );
}
