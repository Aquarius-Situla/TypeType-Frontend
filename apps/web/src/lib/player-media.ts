import { createContext, useContext } from "react";

type PlayerEngineName = "vidstack" | "videojs";

export type PlayerMedia = {
  engine: PlayerEngineName;
  root: HTMLElement | null;
  paused: boolean;
  waiting: boolean;
  seeking: boolean;
  playbackRate: number;
  muted: boolean;
  volume: number;
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  setVolume: (level: number) => void;
  setPlaybackRate: (rate: number) => void;
};

export const PlayerMediaContext = createContext<PlayerMedia | null>(null);

export function usePlayerMedia(): PlayerMedia {
  const media = useContext(PlayerMediaContext);
  if (!media) throw new Error("usePlayerMedia must be used inside a player");
  return media;
}
