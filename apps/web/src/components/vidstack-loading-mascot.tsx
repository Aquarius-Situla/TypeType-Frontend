import type { JSX } from "react";
import { usePlayerLoadingMascot } from "../hooks/use-player-loading-mascot";
import { type VideoLoadingOrientation, videoLoadingVariant } from "../lib/loading-mascot";
import { useMediaState } from "../lib/vidstack";
import { LoadingMascot } from "./loading-mascot";

type Props = {
  orientation?: VideoLoadingOrientation;
  autoplay?: boolean;
  seeking?: boolean;
};

export function VidstackLoadingMascot({
  orientation = "landscape",
  autoplay = false,
  seeking = false,
}: Props): JSX.Element | null {
  const started = useMediaState("started");
  const paused = useMediaState("paused");
  const waiting = useMediaState("waiting");
  const autoPlaying = useMediaState("autoPlaying");
  const phase = usePlayerLoadingMascot({
    started,
    paused,
    waiting,
    autoplaying: autoPlaying,
    autoplay,
    seeking,
  });

  if (!phase) return null;
  const variant = videoLoadingVariant(orientation);
  if (phase === "starting") {
    return (
      <div className="pointer-events-none absolute inset-0 z-10">
        <LoadingMascot variant={variant} surface="fill" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10 grid place-content-center">
      <LoadingMascot variant={variant} surface="overlay" />
    </div>
  );
}
