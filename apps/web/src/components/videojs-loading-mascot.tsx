import { selectPlayback, selectTime, usePlayer } from "@videojs/react";
import type { JSX } from "react";
import { usePlayerLoadingMascot } from "../hooks/use-player-loading-mascot";
import { type VideoLoadingOrientation, videoLoadingVariant } from "../lib/loading-mascot";
import { LoadingMascot } from "./loading-mascot";

// Until the first frame plays, Tyme covers the poster, like the loading screens of the rest of the app; later
// stalls or timeline seeks use the same ring spinner style as the Vidstack player. SABR starts playback itself, so
// the player reads as paused until that first frame: an intended autoplay counts as starting.
export function VideoJsLoadingMascot({
  autoplay = false,
  orientation = "landscape",
}: {
  autoplay?: boolean;
  orientation?: VideoLoadingOrientation;
}): JSX.Element | null {
  const playback = usePlayer(selectPlayback);
  const time = usePlayer(selectTime);
  const phase = usePlayerLoadingMascot({
    started: Boolean(playback?.started),
    paused: playback?.paused ?? true,
    waiting: Boolean(playback?.waiting),
    autoplaying: Boolean(playback?.autoplaying),
    autoplay: Boolean(playback) && autoplay,
    seeking: Boolean(time?.seeking),
  });

  if (!phase) return null;
  if (phase === "starting") {
    return (
      <div className="pointer-events-none absolute inset-0 z-10">
        <LoadingMascot variant={videoLoadingVariant(orientation)} surface="fill" />
      </div>
    );
  }

  return (
    <div
      data-buffering=""
      className="pointer-events-none absolute inset-0 z-10 [--media-brand:var(--video-brand,#f5f5f5)] [--media-buffering-size:64px] sm:[--media-buffering-size:96px]"
    >
      <div className="vds-buffering-indicator">
        <svg
          width={96}
          height={96}
          fill="none"
          viewBox="0 0 120 120"
          aria-hidden="true"
          className="vds-buffering-spinner"
        >
          <circle cx="60" cy="60" r="54" stroke="currentColor" className="vds-buffering-track" />
          <circle
            cx="60"
            cy="60"
            r="54"
            stroke="currentColor"
            pathLength={100}
            className="vds-buffering-track-fill"
          />
        </svg>
      </div>
    </div>
  );
}
