import { type MutableRefObject, useEffect, useRef, useState } from "react";
import { resolveAudioOnlyModeTransition } from "../lib/audio-only-mode-transition";

type Args = {
  currentParam: string;
  defaultEnabled: boolean;
  settingsReady: boolean;
  positionRef: MutableRefObject<number>;
  readPositionMs: () => number | null;
};

export function useWatchAudioOnlyMode({
  currentParam,
  defaultEnabled,
  settingsReady,
  positionRef,
  readPositionMs,
}: Args) {
  const initializedParamRef = useRef<string | null>(null);
  const initializedDefaultRef = useRef<boolean | null>(null);
  const [active, setActive] = useState(false);
  const [switchPositionMs, setSwitchPositionMs] = useState<number | null>(null);
  const initialized = initializedParamRef.current === currentParam;

  useEffect(() => {
    if (!settingsReady) return;
    const paramChanged = initializedParamRef.current !== currentParam;
    const defaultChanged = initializedDefaultRef.current !== defaultEnabled;
    if (!paramChanged && !defaultChanged) return;

    const transition = resolveAudioOnlyModeTransition({
      paramChanged,
      defaultEnabled,
      positionMs: paramChanged ? null : readPositionMs(),
      fallbackPositionMs: positionRef.current,
    });

    initializedParamRef.current = currentParam;
    initializedDefaultRef.current = defaultEnabled;
    setActive(transition.active);
    setSwitchPositionMs(transition.switchPositionMs);

    if (transition.switchPositionMs !== null) {
      positionRef.current = transition.switchPositionMs;
    }
  }, [currentParam, defaultEnabled, positionRef, readPositionMs, settingsReady]);

  function syncPosition() {
    const positionMs = readPositionMs();
    if (positionMs !== null && Number.isFinite(positionMs)) {
      const nextPosition = Math.max(0, positionMs);
      positionRef.current = nextPosition;
      setSwitchPositionMs(nextPosition);
      return nextPosition;
    }
    setSwitchPositionMs(positionRef.current);
    return positionRef.current;
  }

  function toggle() {
    syncPosition();
    setActive((value) => !value);
  }

  function disable() {
    syncPosition();
    setActive(false);
  }

  return {
    active: settingsReady && initialized ? active : defaultEnabled,
    switchPositionMs,
    toggle,
    disable,
  };
}
