import { createContext, useContext } from "react";

export type PlayerKeySignal = {
  key: string;
  at: number;
  onKey?: (key: string) => void;
  onSeek?: (seconds: number) => void;
};

// The last key the player shortcuts saw, so the shortcut feedback can tell a volume or seek change made from the
// keyboard from one made with the mouse. The shortcuts read keys first and stop most of them, so they write it.
export const PlayerKeySignalContext = createContext<{ current: PlayerKeySignal } | null>(null);

export function usePlayerKeySignal() {
  return useContext(PlayerKeySignalContext);
}

export function recentPlayerKey(
  signal: { current: PlayerKeySignal } | null,
  windowMs: number,
): string | null {
  if (!signal) return null;
  return performance.now() - signal.current.at < windowMs ? signal.current.key : null;
}
