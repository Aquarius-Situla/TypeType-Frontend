import { SabrMsePlayer } from "./sabr-mse-player";
import type { VideoJsVideoPlayerProps } from "./videojs-video-player";

const noop = () => undefined;

type Props = {
  video: HTMLVideoElement | null;
  player: VideoJsVideoPlayerProps;
  onAutoplayBlocked: () => void;
};

export function VideoJsSabrEngine({ video, player, onAutoplayBlocked }: Props) {
  if (!player.sabrConfig) return null;
  return (
    <SabrMsePlayer
      config={player.sabrConfig}
      retryKey={player.sabrRetryKey ?? 0}
      playbackRatePreference={player.sabrPlaybackRatePreference}
      video={video}
      startTime={player.startTime ?? 0}
      autoplay={player.autoplay ?? false}
      initialVolume={player.initialVolume ?? 1}
      initialMuted={player.initialMuted ?? false}
      settingsReady={player.settingsReady ?? false}
      onVolumeChange={player.onVolumeChange}
      onAutoplayBlocked={onAutoplayBlocked}
      onError={player.onError ?? noop}
      onSeekStateChange={noop}
      onSeekReady={player.onSeekReady ?? noop}
      onPositionReaderChange={player.onPositionReaderChange ?? noop}
    />
  );
}
