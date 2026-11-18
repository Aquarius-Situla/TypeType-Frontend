import { createContext, useContext } from "react";

// What the shared player tools (hotkeys, gestures, hold to fast forward, wheel volume) need from a player, so they
// work the same over Vidstack and Video.js. Reads are functions: the tools read them on demand instead of
// re-rendering on every time update.
export type PlayerEngine = {
  element: () => HTMLElement | null;
  currentTime: () => number;
  duration: () => number;
  paused: () => boolean;
  playbackRate: () => number;
  volume: () => number;
  canSetVolume: () => boolean;
  play: () => void;
  pause: () => void;
  togglePaused: () => void;
  // How long a mouse press still counts as a click for the player's own tap gesture, when it has a limit.
  mouseTapMaxMs?: number;
  seek: (seconds: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
};

export const PlayerEngineContext = createContext<PlayerEngine | null>(null);

export function usePlayerEngine(): PlayerEngine {
  const engine = useContext(PlayerEngineContext);
  if (!engine) throw new Error("usePlayerEngine needs a PlayerEngineContext provider");
  return engine;
}
