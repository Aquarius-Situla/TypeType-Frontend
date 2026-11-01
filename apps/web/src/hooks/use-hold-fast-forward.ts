import { useCallback, useRef, useState } from "react";
import { normalizeHoldPlaybackSpeed } from "../lib/playback-speed";
import { HOLD_FAST_FORWARD_ATTRIBUTE } from "../lib/sabr-playback-rate-preference";
import { useMediaPlayer, useMediaRemote, useMediaState } from "../lib/vidstack";
import { useSettings } from "./use-settings";

const HOLD_DELAY_MS = 180;

type HoldFastForward = {
  holding: boolean;
  isActive: () => boolean;
  start: () => void;
  restore: (updateIndicator?: boolean) => void;
};

export function useHoldFastForward(): HoldFastForward {
  const remote = useMediaRemote();
  const player = useMediaPlayer();
  const { settings } = useSettings();
  const paused = useMediaState("paused");
  const playbackRate = useMediaState("playbackRate");
  const [holding, setHolding] = useState(false);
  const remoteRef = useRef(remote);
  const pausedRef = useRef(true);
  const rateRef = useRef(1);
  const timerRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const startedPausedRef = useRef(false);
  const restoreRateRef = useRef(1);
  const playerRef = useRef<HTMLElement | null>(null);
  const holdSpeedRef = useRef(2);

  remoteRef.current = remote;
  playerRef.current = player?.el ?? null;
  holdSpeedRef.current = normalizeHoldPlaybackSpeed(settings.holdPlaybackSpeed);
  pausedRef.current = paused;
  rateRef.current = Number.isFinite(playbackRate) && playbackRate > 0 ? playbackRate : 1;

  const clear = useCallback(() => {
    if (timerRef.current === null) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const start = useCallback(() => {
    if (timerRef.current !== null || activeRef.current) return;
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      activeRef.current = true;
      setHolding(true);
      playerRef.current?.toggleAttribute(HOLD_FAST_FORWARD_ATTRIBUTE, true);
      startedPausedRef.current = pausedRef.current;
      restoreRateRef.current = rateRef.current;
      remoteRef.current.changePlaybackRate(holdSpeedRef.current);
      if (pausedRef.current) void Promise.resolve(remoteRef.current.play()).catch(() => {});
    }, HOLD_DELAY_MS);
  }, []);

  const restore = useCallback(
    (updateIndicator = true) => {
      clear();
      if (!activeRef.current) return;
      activeRef.current = false;
      if (updateIndicator) setHolding(false);
      remoteRef.current.changePlaybackRate(restoreRateRef.current);
      playerRef.current?.toggleAttribute(HOLD_FAST_FORWARD_ATTRIBUTE, false);
      if (startedPausedRef.current) void Promise.resolve(remoteRef.current.pause()).catch(() => {});
      startedPausedRef.current = false;
    },
    [clear],
  );

  const isActive = useCallback(() => activeRef.current, []);

  return { holding, isActive, start, restore };
}
