import { selectPlayback, selectTime, usePlayer } from "@videojs/react";
import { useEffect, useRef } from "react";

const STALL_MS = 8_000;
const CHECK_MS = 2_000;

// When the live service restarts, the stream it hands back can start a new playlist that hls.js waits on forever
// without raising an error, so the page-level recovery never runs and only a reload helped. A live that should be
// playing but whose clock has not moved for a while is reported as failed, which makes the recovery fetch it again.
export function VideoJsLiveStallWatchdog({ onStall }: { onStall: () => void }) {
  const paused = usePlayer(selectPlayback)?.paused ?? true;
  const time = usePlayer(selectTime)?.currentTime ?? 0;
  const latest = useRef({ paused, time, onStall });
  latest.current = { paused, time, onStall };

  useEffect(() => {
    let last = latest.current.time;
    let since = performance.now();
    const check = setInterval(() => {
      const now = performance.now();
      const { paused: idle, time: clock, onStall: report } = latest.current;
      if (idle || clock !== last) {
        last = clock;
        since = now;
      } else if (now - since > STALL_MS) {
        since = now;
        report();
      }
    }, CHECK_MS);
    return () => clearInterval(check);
  }, []);

  return null;
}
