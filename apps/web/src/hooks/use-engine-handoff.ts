import { useCallback, useRef, useState } from "react";

type Handoff = { engine: string; playerKey: string; positionMs: number | null };

// Switching between Video.js and Vidstack mounts a new player; it starts where the previous one was, not at the
// position the page was opened with.
export function useEngineHandoff(
  engine: string,
  playerKey: string,
  startTime: number,
  onTimeUpdate: (positionMs: number) => void,
): { startTime: number; onTimeUpdate: (positionMs: number) => void } {
  const position = useRef<number | null>(null);
  const [handoff, setHandoff] = useState<Handoff>({ engine, playerKey, positionMs: null });
  if (handoff.engine !== engine || handoff.playerKey !== playerKey) {
    const positionMs = handoff.playerKey === playerKey ? position.current : null;
    setHandoff({ engine, playerKey, positionMs });
  }
  const forward = useRef(onTimeUpdate);
  forward.current = onTimeUpdate;
  const trackTime = useCallback((positionMs: number) => {
    position.current = positionMs;
    forward.current(positionMs);
  }, []);
  return { startTime: handoff.positionMs ?? startTime, onTimeUpdate: trackTime };
}
