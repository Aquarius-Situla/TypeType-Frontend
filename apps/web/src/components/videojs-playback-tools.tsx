import { MediaSessionSync } from "./media-session-sync";
import { PlayerHotkeys } from "./player-hotkeys";
import { SponsorBlockSkipper } from "./player-internals";
import { SponsorBlockCurrentSegment } from "./sponsorblock-current-segment";
import { SponsorBlockSkipNotice } from "./sponsorblock-skip-notice";
import type { VideoJsVideoPlayerProps } from "./videojs-video-player";

type Props = { player: VideoJsVideoPlayerProps; sabrVideo: HTMLVideoElement | null };

export function VideoJsPlaybackTools({ player, sabrVideo }: Props) {
  const live = player.streamType === "live";
  const segments = player.sponsorBlockSegments;
  const autoSkip = player.autoSkipSponsorBlock !== false && player.autoSkipSponsorBlockSegments;
  return (
    <>
      <PlayerHotkeys canSeek={!live} />
      {autoSkip && (
        <SponsorBlockSkipper
          segments={player.autoSkipSponsorBlockSegments ?? []}
          muteInsteadOfSkip={player.muteSponsorBlockInsteadOfSkip ?? false}
        />
      )}
      {segments && <SponsorBlockSkipNotice />}
      {segments && player.showCurrentSponsorBlockSegment && (
        <SponsorBlockCurrentSegment
          segments={segments}
          autoSkipSegments={player.autoSkipSponsorBlockSegments}
          manualSkipSegments={player.manualSkipSponsorBlockSegments}
          muteInsteadOfSkip={player.muteSponsorBlockInsteadOfSkip ?? false}
        />
      )}
      <MediaSessionSync
        title={player.title}
        artwork={player.poster}
        canSeek={!live}
        isLive={live}
        sabrVideo={sabrVideo}
        onPreviousTrack={player.onPreviousVideo}
        onNextTrack={player.onNextVideo}
      />
    </>
  );
}
