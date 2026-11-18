import { lazy, type ReactNode, Suspense } from "react";
import type { AdBreak } from "../hooks/use-ad-break";
import type { AutoplayState } from "../hooks/use-watch-ended-navigation";
import { AutoplayCountdownOverlay } from "./autoplay-countdown-overlay";

// Loaded only once a viewer who turned the pre-roll on opens a video: nobody else downloads it.
const PrerollOverlay = lazy(() => import("./preroll-overlay"));

type Props = {
  streamId: string;
  overlay: ReactNode;
  adBreak: AdBreak;
  // The video starts by itself once the pre-roll is over.
  resume: boolean;
  autoplayState: AutoplayState | null;
  onAutoplayPlayNow: () => void;
  onAutoplayCancel: () => void;
  onAutoplayPauseToggle: () => void;
};

// What the watch page lays over its player: the overlay of the page, the pre-roll, the countdown.
export function WatchStageOverlays({
  streamId,
  overlay,
  adBreak,
  resume,
  autoplayState,
  onAutoplayPlayNow,
  onAutoplayCancel,
  onAutoplayPauseToggle,
}: Props) {
  return (
    <>
      {overlay}
      {adBreak.ad && (
        <Suspense fallback={<div className="absolute inset-0 z-[60] bg-black" />}>
          <PrerollOverlay
            key={streamId}
            ad={adBreak.ad}
            progress={adBreak.progress}
            resume={resume}
            onFinish={adBreak.finish}
          />
        </Suspense>
      )}
      {autoplayState && (
        <AutoplayCountdownOverlay
          target={autoplayState.target}
          totalSeconds={autoplayState.totalSeconds}
          paused={autoplayState.paused}
          onPlayNow={onAutoplayPlayNow}
          onCancel={onAutoplayCancel}
          onPauseToggle={onAutoplayPauseToggle}
        />
      )}
    </>
  );
}
