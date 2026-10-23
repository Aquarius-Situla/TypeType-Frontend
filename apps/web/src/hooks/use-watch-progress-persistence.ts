import { useCallback, useEffect, useRef } from "react";
import { recordClientEvent } from "../lib/client-debug-log";
import { debugConsole } from "../lib/debug-console";
import { evaluateProgressPersistence, type SaveReason } from "../lib/watch-resume";

type MutateFn = (positionMs: number, keepalive: boolean) => void;

type Args = {
  durationSec: number;
  isLive: boolean;
  mutate: MutateFn;
};

export function useWatchProgressPersistence({ durationSec, isLive, mutate }: Args) {
  const positionRef = useRef(0);
  const lastSavedPositionRef = useRef(0);
  const lastSeekedSaveRef = useRef(0);
  const maxPositionSeenRef = useRef(0);
  const mutateRef = useRef(mutate);
  mutateRef.current = mutate;

  const saveRef = useRef<(reason: SaveReason) => void>(() => {});
  saveRef.current = (reason: SaveReason) => {
    const positionMs = Math.max(0, Math.round(positionRef.current));
    const durationMs = durationSec * 1000;
    const previousSaved = lastSavedPositionRef.current;
    const decision = evaluateProgressPersistence({
      positionMs,
      lastSavedPositionMs: previousSaved,
      maxPositionSeenMs: maxPositionSeenRef.current,
      durationMs,
      reason,
    });
    if (!decision.shouldSave) return;
    lastSavedPositionRef.current = decision.positionMs;
    recordClientEvent("progress.save", { positionMs: decision.positionMs, reason });
    if (decision.isBackwardJump) {
      debugConsole("progress.backward_seek", {
        positionMs: decision.positionMs,
        previousSavedMs: previousSaved,
        reason,
      });
    } else {
      debugConsole("progress.saved", {
        positionMs: decision.positionMs,
        reason,
        keepalive: decision.keepalive,
      });
    }
    mutateRef.current(decision.positionMs, decision.keepalive);
  };

  const handleTimeUpdate = useCallback(
    (positionMs: number) => {
      positionRef.current = positionMs;
      maxPositionSeenRef.current = Math.max(maxPositionSeenRef.current, positionMs);
      if (!isLive && positionMs >= 5000 && lastSavedPositionRef.current < 5000) {
        saveRef.current("threshold");
      }
    },
    [isLive],
  );

  const handlePause = useCallback(() => {
    saveRef.current("pause");
  }, []);

  const handleSeeked = useCallback(() => {
    const positionMs = Math.max(0, Math.round(positionRef.current));
    if (positionMs === lastSeekedSaveRef.current) return;
    lastSeekedSaveRef.current = positionMs;
    saveRef.current("seeked");
  }, []);

  useEffect(() => {
    if (isLive) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") saveRef.current("visibility");
    };
    const onPageHide = () => {
      saveRef.current("pagehide");
    };
    const onBeforeUnload = () => {
      saveRef.current("beforeunload");
    };
    const interval = setInterval(() => saveRef.current("interval"), 5_000);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      saveRef.current("unmount");
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [isLive]);

  return {
    positionRef,
    handleTimeUpdate,
    handlePause,
    handleSeeked,
  };
}
