import { useEffect, useRef } from "react";
import {
  clampTime,
  consumeEvent,
  isEditableTarget,
  isInteractiveTarget,
  isPlaybackToggleShortcut,
  isPlayerSeekShortcutTarget,
  type KeyboardSeekTarget,
  keyboardSeekOffset,
  nextKeyboardRate,
  nextKeyboardSeekTarget,
} from "../components/player-hotkeys-utils";
import { usePlayerEngine } from "../lib/player-engine";
import { usePlayerKeySignal } from "../lib/player-key-signal";
import { useDanmakuStore } from "../stores/danmaku-store";
import { useWatchLayoutStore } from "../stores/watch-layout-store";
import { useHoldFastForward } from "./use-hold-fast-forward";

const FRAME_STEP_SECONDS = 1 / 30;
const RATE_STEP = 0.25;

export function usePlayerKeyboard(canSeek: boolean, playbackOnly = false) {
  const engine = usePlayerEngine();
  const keySignal = usePlayerKeySignal();
  const { holding, isActive, start, restore } = useHoldFastForward();
  const spaceStartedRef = useRef(false);
  const seekTargetRef = useRef<KeyboardSeekTarget>({
    position: 0,
    updatedAt: Number.NEGATIVE_INFINITY,
  });

  useEffect(() => {
    const togglePaused = () => engine.togglePaused();

    function stepFrame(direction: -1 | 1) {
      if (!canSeek || !engine.paused()) return;
      engine.seek(
        clampTime(engine.currentTime() + FRAME_STEP_SECONDS * direction, engine.duration()),
      );
    }

    function stepRate(delta: number) {
      if (isActive()) return;
      engine.setPlaybackRate(nextKeyboardRate(engine.playbackRate(), delta));
    }

    function seekBy(seconds: number) {
      if (!canSeek) return;
      seekTargetRef.current = nextKeyboardSeekTarget(
        engine.currentTime(),
        engine.duration(),
        seconds,
        seekTargetRef.current,
        performance.now(),
      );
      engine.seek(seekTargetRef.current.position);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (keySignal && !isEditableTarget(event.target)) {
        keySignal.current.key = event.key;
        keySignal.current.at = performance.now();
        keySignal.current.onKey?.(event.key);
      }
      if (event.key === "Escape" || event.code === "Escape") {
        if (useWatchLayoutStore.getState().webFullscreen) {
          consumeEvent(event);
          useWatchLayoutStore.getState().setWebFullscreen(false);
          return;
        }
      }
      if (playbackOnly && !isPlaybackToggleShortcut(event.code)) return;
      const seekOffset = keyboardSeekOffset(event.code);
      if (seekOffset !== null && isPlayerSeekShortcutTarget(event.target, engine.element())) {
        consumeEvent(event);
        seekBy(seekOffset);
        keySignal?.current.onSeek?.(seekOffset);
        return;
      }
      if (isInteractiveTarget(event.target)) return;
      if (event.key === "w" || event.key === "W" || event.code === "KeyW") {
        consumeEvent(event);
        useWatchLayoutStore.getState().toggleWebFullscreen();
        return;
      }
      if (event.key === "t" || event.key === "T" || event.code === "KeyT") {
        consumeEvent(event);
        useWatchLayoutStore.getState().toggleCinemaMode();
        return;
      }
      if (event.key === "d" || event.key === "D" || event.code === "KeyD") {
        const el = event.target instanceof Element ? event.target : null;
        if (el?.closest("input, textarea, select, [contenteditable='true'], [role='menu']")) {
          return;
        }
        consumeEvent(event);
        useDanmakuStore.getState().toggle();
        return;
      }
      if (isPlaybackToggleShortcut(event.code)) {
        consumeEvent(event);
        if (!event.repeat) togglePaused();
        return;
      }
      if (event.code === "Space") {
        consumeEvent(event);
        if (!event.repeat) {
          spaceStartedRef.current = true;
          start();
        }
        return;
      }
      if (event.key === ">" || event.key === "<") {
        consumeEvent(event);
        stepRate(event.key === ">" ? RATE_STEP : -RATE_STEP);
        return;
      }
      if (event.key === "," || event.code === "Comma") {
        consumeEvent(event);
        stepFrame(-1);
        return;
      }
      if (event.key === "." || event.code === "Period") {
        consumeEvent(event);
        stepFrame(1);
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.code !== "Space" || !spaceStartedRef.current) return;
      spaceStartedRef.current = false;
      consumeEvent(event);
      const wasHolding = isActive();
      restore();
      if (!wasHolding) togglePaused();
    }

    function onBlur() {
      spaceStartedRef.current = false;
      seekTargetRef.current.updatedAt = Number.NEGATIVE_INFINITY;
      restore();
    }

    const options = { capture: true };
    window.addEventListener("keydown", onKeyDown, options);
    window.addEventListener("keyup", onKeyUp, options);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown, options);
      window.removeEventListener("keyup", onKeyUp, options);
      window.removeEventListener("blur", onBlur);
      restore(false);
    };
  }, [canSeek, engine, start, restore, isActive, playbackOnly, keySignal]);

  return holding;
}
