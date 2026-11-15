import { type ReactNode, useMemo } from "react";
import { type PlayerMedia, PlayerMediaContext } from "../lib/player-media";
import { useMediaPlayer, useMediaRemote, useMediaState } from "../lib/vidstack";

export function VidstackPlayerMedia({ children }: { children: ReactNode }) {
  const player = useMediaPlayer();
  const remote = useMediaRemote();
  const paused = useMediaState("paused");
  const waiting = useMediaState("waiting");
  const seeking = useMediaState("seeking");
  const playbackRate = useMediaState("playbackRate");
  const muted = useMediaState("muted");
  const volume = useMediaState("volume");
  const root = player?.el ?? null;
  const actions = useMemo(
    () => ({
      play: () => remote.play(),
      pause: () => remote.pause(),
      seek: (seconds: number) => remote.seek(seconds),
      setVolume: (level: number) => remote.changeVolume(level),
      setPlaybackRate: (rate: number) => remote.changePlaybackRate(rate),
    }),
    [remote],
  );
  const media = useMemo<PlayerMedia>(
    () => ({
      engine: "vidstack",
      root,
      paused,
      waiting,
      seeking,
      playbackRate,
      muted,
      volume,
      ...actions,
    }),
    [root, paused, waiting, seeking, playbackRate, muted, volume, actions],
  );
  return <PlayerMediaContext.Provider value={media}>{children}</PlayerMediaContext.Provider>;
}
