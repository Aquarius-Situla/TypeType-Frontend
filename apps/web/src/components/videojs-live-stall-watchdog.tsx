import { type RefObject, useEffect, useRef } from "react";
import { nextStallClock, type StallClock } from "../lib/live-stall-clock";

const CHECK_MS = 2_000;

// When the live service restarts, the stream it hands back can start a new playlist that hls.js waits on forever
// without raising an error, so the page-level recovery never runs and only a reload helped. A live that should be
// playing but whose clock has not moved for a while is reported as failed, which makes the recovery fetch it again.
// The clock is read on the element itself rather than on the rendered player state, so the check does not depend on
// how often the page renders.
export function VideoJsLiveStallWatchdog({
  video,
  onStall,
}: {
  video: RefObject<HTMLVideoElement | null>;
  onStall: () => void;
}) {
  const report = useRef(onStall);
  report.current = onStall;

  useEffect(() => {
    let state: StallClock = { clock: video.current?.currentTime ?? 0, since: performance.now() };
    const sample = () => {
      const element = video.current;
      return {
        clock: element?.currentTime ?? 0,
        now: performance.now(),
        playing: Boolean(element && !element.paused),
        visible: !document.hidden,
      };
    };
    const check = setInterval(() => {
      const next = nextStallClock(state, sample());
      state = next.state;
      if (next.stalled) report.current();
    }, CHECK_MS);
    const restart = () => {
      const now = sample();
      state = { clock: now.clock, since: now.now };
    };
    document.addEventListener("visibilitychange", restart);
    return () => {
      clearInterval(check);
      document.removeEventListener("visibilitychange", restart);
    };
  }, [video]);

  return null;
}
