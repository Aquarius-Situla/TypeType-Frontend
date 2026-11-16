import { type RefObject, useEffect, useRef } from "react";

const STALL_MS = 8_000;
const CHECK_MS = 2_000;

// When the live service restarts, the stream it hands back can start a new playlist that hls.js waits on forever
// without raising an error, so the page-level recovery never runs and only a reload helped. A live that should be
// playing but whose clock has not moved for a while is reported as failed, which makes the recovery fetch it again.
// The clock is read on the element itself rather than on the rendered player state, so the check does not depend on
// how often the page renders, which browsers slow down in background tabs.
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
    let last = video.current?.currentTime ?? 0;
    let since = performance.now();
    const check = setInterval(() => {
      const now = performance.now();
      const element = video.current;
      const clock = element?.currentTime ?? 0;
      if (!element || element.paused || clock !== last) {
        last = clock;
        since = now;
      } else if (now - since > STALL_MS) {
        since = now;
        report.current();
      }
    }, CHECK_MS);
    return () => clearInterval(check);
  }, [video]);

  return null;
}
