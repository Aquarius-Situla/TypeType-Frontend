import { useState } from "react";
import { useCompactPlayer } from "../hooks/use-compact-player";
import { adIsDue, readAdVault } from "../lib/ad-vault";
import { shouldRunSponsorBlockAutoSkip } from "../lib/sponsorblock-playback-tools";
import { useMediaState } from "../lib/vidstack";
import type { SponsorBlockSegmentItem } from "../types/api";
import { PlayerHotkeys } from "./player-hotkeys";
import { SponsorBlockSkipper } from "./player-internals";
import { SponsorBlockBar } from "./sponsorblock-bar";
import { SponsorBlockCurrentSegment } from "./sponsorblock-current-segment";
import { SponsorBlockSkipNotice } from "./sponsorblock-skip-notice";

type Props = {
  canSeek: boolean;
  audioOnly: boolean;
  sabrVideo: HTMLVideoElement | null;
  segments?: SponsorBlockSegmentItem[];
  autoSkipSegments?: SponsorBlockSegmentItem[];
  manualSkipSegments?: SponsorBlockSegmentItem[];
  autoSkip: boolean;
  mutedSkip: boolean;
  showCurrent: boolean;
};

export function VideoPlayerPlaybackTools(props: Props) {
  const floating = useCompactPlayer();
  const fullscreen = useMediaState("fullscreen");
  const compact = floating && !fullscreen;
  // Ad mode only reads local storage: nothing is requested for viewers who never turned it on.
  const [adBreak] = useState(() => adIsDue(readAdVault()));
  return (
    <>
      <PlayerHotkeys canSeek={props.canSeek} sabrVideo={props.sabrVideo} compact={compact} />
      {shouldRunSponsorBlockAutoSkip(props) && props.autoSkipSegments && (
        <SponsorBlockSkipper
          segments={props.autoSkipSegments}
          muteInsteadOfSkip={props.mutedSkip}
        />
      )}
      {!compact && (props.segments || adBreak) && (
        <SponsorBlockBar segments={props.segments ?? []} adBreak={adBreak} />
      )}
      {!compact && props.segments && <SponsorBlockSkipNotice />}
      {!compact && props.showCurrent && props.segments && (
        <SponsorBlockCurrentSegment
          segments={props.segments}
          autoSkipSegments={props.autoSkipSegments}
          manualSkipSegments={props.manualSkipSegments}
          muteInsteadOfSkip={props.mutedSkip}
        />
      )}
    </>
  );
}
