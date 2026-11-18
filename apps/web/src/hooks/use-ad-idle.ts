import { useEffect, useRef, useState } from "react";

// The controls fade out after this long without the pointer moving, as in the player.
const IDLE_MS = 2500;

// Whether the controls of an ad show: always while it rests (paused, blocked, covered by a screen),
// otherwise until the pointer has been still for a moment. `wake` brings them back.
export function useAdIdle(resting: boolean): { shown: boolean; wake: () => void } {
  const [idle, setIdle] = useState(false);
  const timer = useRef(0);
  function wake() {
    setIdle(false);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setIdle(true), IDLE_MS);
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: the timer restarts whenever the ad starts or stops
  useEffect(() => {
    wake();
    return () => window.clearTimeout(timer.current);
  }, [resting]);
  return { shown: resting || !idle, wake };
}
