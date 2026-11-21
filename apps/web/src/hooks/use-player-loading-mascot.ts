import { useEffect, useState } from "react";
import { type PlayerLoadingPhase, resolvePlayerLoadingInput } from "../lib/player-loading-state";

// A short wait hides the mascot for brief stalls the eye would not notice anyway.
const STALL_DELAY_MS = 400;

export function usePlayerLoadingMascot(input: {
  started: boolean;
  paused: boolean;
  waiting: boolean;
  autoplaying: boolean;
  autoplay: boolean;
  seeking?: boolean;
}): PlayerLoadingPhase {
  const { starting, stalled } = resolvePlayerLoadingInput(input);
  const [late, setLate] = useState(false);

  useEffect(() => {
    if (!stalled) {
      setLate(false);
      return;
    }
    const timer = window.setTimeout(() => setLate(true), STALL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [stalled]);

  if (starting) return "starting";
  if (late) return "stalled";
  return null;
}
