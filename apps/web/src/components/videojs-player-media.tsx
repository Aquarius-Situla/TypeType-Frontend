import {
  selectPlayback,
  selectPlaybackRate,
  selectTime,
  selectVolume,
  usePlayer,
} from "@videojs/react";
import { type ReactNode, useMemo, useRef } from "react";
import { type PlayerMedia, PlayerMediaContext } from "../lib/player-media";

type Props = { root: HTMLElement | null; children: ReactNode };

export function VideoJsPlayerMedia({ root, children }: Props) {
  const playback = usePlayer(selectPlayback);
  const time = usePlayer(selectTime);
  const volume = usePlayer(selectVolume);
  const rate = usePlayer(selectPlaybackRate);
  const actions = useRef({ playback, time, volume, rate });
  actions.current = { playback, time, volume, rate };
  const paused = playback?.paused ?? true;
  const waiting = playback?.waiting ?? false;
  const seeking = time?.seeking ?? false;
  const playbackRate = rate?.playbackRate ?? 1;
  const muted = volume?.muted ?? false;
  const level = volume?.volume ?? 1;
  const stable = useMemo(
    () => ({
      play: () => void actions.current.playback?.play(),
      pause: () => actions.current.playback?.pause(),
      seek: (seconds: number) => void actions.current.time?.seek(seconds),
      setVolume: (value: number) => void actions.current.volume?.setVolume(value),
      setPlaybackRate: (value: number) => actions.current.rate?.setPlaybackRate(value),
    }),
    [],
  );
  const media = useMemo<PlayerMedia>(
    () => ({
      engine: "videojs",
      root,
      paused,
      waiting,
      seeking,
      playbackRate,
      muted,
      volume: level,
      ...stable,
    }),
    [root, paused, waiting, seeking, playbackRate, muted, level, stable],
  );
  return <PlayerMediaContext.Provider value={media}>{children}</PlayerMediaContext.Provider>;
}
