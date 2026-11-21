import { selectPlayback, usePlayer } from "@videojs/react";
import type { JSX } from "react";
import { usePlayerLoadingMascot } from "../hooks/use-player-loading-mascot";
import { type VideoLoadingOrientation, videoLoadingVariant } from "../lib/loading-mascot";
import { LoadingMascot } from "./loading-mascot";

// Until the first frame plays, the mascot covers the poster, like the loading screens of the rest of the app; later
// stalls show it over the last frame. SABR starts playback itself, so the player reads as paused until that first
// frame: an intended autoplay counts as starting.
export function VideoJsLoadingMascot({
  autoplay = false,
  orientation = "landscape",
}: {
  autoplay?: boolean;
  orientation?: VideoLoadingOrientation;
}): JSX.Element | null {
  const playback = usePlayer(selectPlayback);
  const phase = usePlayerLoadingMascot({
    started: Boolean(playback?.started),
    paused: playback?.paused ?? true,
    waiting: Boolean(playback?.waiting),
    autoplaying: Boolean(playback?.autoplaying),
    autoplay: Boolean(playback) && autoplay,
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
