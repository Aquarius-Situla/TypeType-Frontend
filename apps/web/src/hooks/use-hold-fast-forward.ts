import { useCallback, useRef, useState } from "react";
import { normalizeHoldPlaybackSpeed } from "../lib/playback-speed";
import { usePlayerEngine } from "../lib/player-engine";
import { HOLD_FAST_FORWARD_ATTRIBUTE } from "../lib/sabr-playback-rate-preference";
import { useSettings } from "./use-settings";

const HOLD_DELAY_MS = 180;

type HoldFastForward = {
  holding: boolean;
  isActive: () => boolean;
  start: () => void;
  restore: (updateIndicator?: boolean) => void;
};

export function useHoldFastForward(): HoldFastForward {
  const engine = usePlayerEngine();
  const { settings } = useSettings();
  const [holding, setHolding] = useState(false);
  const timerRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const startedPausedRef = useRef(false);
  const restoreRateRef = useRef(1);
  const holdSpeedRef = useRef(2);

  holdSpeedRef.current = normalizeHoldPlaybackSpeed(settings.holdPlaybackSpeed);

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
      engine.element()?.toggleAttribute(HOLD_FAST_FORWARD_ATTRIBUTE, true);
      startedPausedRef.current = engine.paused();
      restoreRateRef.current = engine.playbackRate();
      engine.setPlaybackRate(holdSpeedRef.current);
      if (startedPausedRef.current) engine.play();
    }, HOLD_DELAY_MS);
  }, [engine]);

  const restore = useCallback(
    (updateIndicator = true) => {
      clear();
      if (!activeRef.current) return;
      activeRef.current = false;
      if (updateIndicator) setHolding(false);
      engine.setPlaybackRate(restoreRateRef.current);
      engine.element()?.toggleAttribute(HOLD_FAST_FORWARD_ATTRIBUTE, false);
      if (startedPausedRef.current) engine.pause();
      startedPausedRef.current = false;
    },
    [clear, engine],
  );

  const isActive = useCallback(() => activeRef.current, []);

  return { holding, isActive, start, restore };
}
