import { type ReactNode, useMemo, useRef } from "react";
import { type PlayerEngine, PlayerEngineContext } from "../lib/player-engine";
import { requestSabrSeek, requestSabrVidstackPlayback } from "../lib/sabr-vidstack-bridge";
import { useMediaPlayer, useMediaRemote, useMediaState } from "../lib/vidstack";

type Props = { sabrVideo: HTMLVideoElement | null; children: ReactNode };

export function VidstackPlayerEngine({ sabrVideo, children }: Props) {
  const player = useMediaPlayer();
  const remote = useMediaRemote();
  const state = {
    currentTime: useMediaState("currentTime"),
    duration: useMediaState("duration"),
    paused: useMediaState("paused"),
    playbackRate: useMediaState("playbackRate"),
    volume: useMediaState("volume"),
    canSetVolume: useMediaState("canSetVolume"),
  };
  const element = player?.el ?? null;
  const latest = useRef({ state, remote, sabrVideo });
  latest.current = { state, remote, sabrVideo };

  const engine = useMemo<PlayerEngine>(() => {
    const finite = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback);
    const play = () => void Promise.resolve(latest.current.remote.play()).catch(() => {});
    const pause = () => void Promise.resolve(latest.current.remote.pause()).catch(() => {});
    return {
      element: () => element,
      currentTime: () => finite(latest.current.state.currentTime, 0),
      duration: () => finite(latest.current.state.duration, 0),
      paused: () => latest.current.state.paused,
      playbackRate: () => {
        const rate = latest.current.state.playbackRate;
        return Number.isFinite(rate) && rate > 0 ? rate : 1;
      },
      volume: () => latest.current.state.volume,
      canSetVolume: () => latest.current.state.canSetVolume,
      play,
      pause,
      togglePaused: () => {
        const { sabrVideo: video, state: current } = latest.current;
        if (video) {
          void requestSabrVidstackPlayback(video, current.paused, true).catch(() => {});
          return;
        }
        if (current.paused) play();
        else pause();
      },
      seek: (seconds) => {
        const video = latest.current.sabrVideo;
        if (video && requestSabrSeek(video, seconds)) return;
        latest.current.remote.seek(seconds);
      },
      setPlaybackRate: (rate) => latest.current.remote.changePlaybackRate(rate),
      setVolume: (volume) => latest.current.remote.changeVolume(volume),
    };
  }, [element]);

  return <PlayerEngineContext.Provider value={engine}>{children}</PlayerEngineContext.Provider>;
}
