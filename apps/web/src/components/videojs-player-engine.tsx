import {
  selectPlayback,
  selectPlaybackRate,
  selectTime,
  selectVolume,
  usePlayer,
} from "@videojs/react";
import { type ReactNode, useMemo, useRef } from "react";
import { type PlayerEngine, PlayerEngineContext } from "../lib/player-engine";

// Video.js drops a tap held longer than this, and does not export the value.
const VIDEOJS_TAP_MAX_MS = 250;

type Props = { root: HTMLElement | null; children: ReactNode };

export function VideoJsPlayerEngine({ root, children }: Props) {
  const slices = {
    time: usePlayer(selectTime),
    playback: usePlayer(selectPlayback),
    rate: usePlayer(selectPlaybackRate),
    volume: usePlayer(selectVolume),
  };
  const latest = useRef({ slices });
  latest.current = { slices };

  const engine = useMemo<PlayerEngine>(() => {
    const finite = (value: number | undefined, fallback: number) =>
      value !== undefined && Number.isFinite(value) ? value : fallback;
    const play = () => void latest.current.slices.playback?.play().catch(() => {});
    const pause = () => latest.current.slices.playback?.pause();
    return {
      element: () => root,
      currentTime: () => finite(latest.current.slices.time?.currentTime, 0),
      duration: () => finite(latest.current.slices.time?.duration, 0),
      paused: () => latest.current.slices.playback?.paused ?? true,
      playbackRate: () => {
        const rate = latest.current.slices.rate?.playbackRate;
        return rate !== undefined && Number.isFinite(rate) && rate > 0 ? rate : 1;
      },
      volume: () => latest.current.slices.volume?.volume ?? 1,
      canSetVolume: () => latest.current.slices.volume?.volumeAvailability === "available",
      play,
      pause,
      mouseTapMaxMs: VIDEOJS_TAP_MAX_MS,
      togglePaused: () => {
        if (latest.current.slices.playback?.paused) play();
        else pause();
      },
      seek: (seconds) => void latest.current.slices.time?.seek(seconds),
      setPlaybackRate: (rate) => latest.current.slices.rate?.setPlaybackRate(rate),
      setVolume: (volume) => latest.current.slices.volume?.setVolume(volume),
    };
  }, [root]);

  return <PlayerEngineContext.Provider value={engine}>{children}</PlayerEngineContext.Provider>;
}
