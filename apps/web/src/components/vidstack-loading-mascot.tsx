import type { JSX } from "react";
import { type VideoLoadingOrientation, videoLoadingVariant } from "../lib/loading-mascot";
import { isPlayerStartingLoading } from "../lib/player-loading-state";
import { DefaultBufferingIndicator, useMediaState } from "../lib/vidstack";
import { LoadingMascot } from "./loading-mascot";

type Props = {
  orientation?: VideoLoadingOrientation;
  autoplay?: boolean;
};

export function VidstackLoadingMascot({
  orientation = "landscape",
  autoplay = false,
}: Props): JSX.Element | null {
  const started = useMediaState("started");
  const paused = useMediaState("paused");
  const autoPlaying = useMediaState("autoPlaying");

  // Once playback has started, mid-video buffering and timeline seeks fall back to Vidstack's spinner.
  if (started) return <DefaultBufferingIndicator />;

  if (!isPlayerStartingLoading({ started, paused, autoplaying: autoPlaying, autoplay })) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <LoadingMascot variant={videoLoadingVariant(orientation)} surface="fill" />
    </div>
  );
}
