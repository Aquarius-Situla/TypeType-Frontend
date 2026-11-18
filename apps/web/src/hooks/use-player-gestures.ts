import { useEffect, useRef } from "react";
import {
  computeScrubTarget,
  consumePointerEvent,
  exceededDragThreshold,
  isFastForwardPointer,
  isInteractiveTarget,
} from "../components/player-hotkeys-utils";
import { usePlayerEngine } from "../lib/player-engine";
import { useHoldFastForward } from "./use-hold-fast-forward";

const SEEK_THROTTLE_MS = 80;
const SCRUB_RANGE_SECONDS = 90;
const MOUSE_HOLD_DELAY_MS = 500;

export function usePlayerGestures(canSeek: boolean, enabled = true) {
  const engine = usePlayerEngine();
  const { holding, isActive, start, restore } = useHoldFastForward();
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const scrubbingRef = useRef(false);
  const targetRef = useRef(0);
  const lastSeekRef = useRef(0);
  const suppressTapRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    function endScrub(commit: boolean) {
      if (!scrubbingRef.current) return;
      scrubbingRef.current = false;
      if (commit) engine.seek(targetRef.current);
    }

    function onPointerDown(event: PointerEvent) {
      if (!isFastForwardPointer(event)) return;
      if (event.defaultPrevented || isInteractiveTarget(event.target)) return;
      if (pointerIdRef.current !== null) return;
      pointerIdRef.current = event.pointerId;
      startXRef.current = event.clientX;
      startYRef.current = event.clientY;
      startTimeRef.current = engine.currentTime();
      suppressTapRef.current = false;
      start(event.pointerType === "mouse" ? MOUSE_HOLD_DELAY_MS : undefined);
    }

    function onPointerMove(event: PointerEvent) {
      if (pointerIdRef.current !== event.pointerId || !canSeek) return;
      if (event.pointerType === "mouse") return;
      const dx = event.clientX - startXRef.current;
      if (!scrubbingRef.current) {
        if (!exceededDragThreshold(dx, event.clientY - startYRef.current)) return;
        scrubbingRef.current = true;
        suppressTapRef.current = true;
        lastSeekRef.current = 0;
        restore();
      }
      targetRef.current = computeScrubTarget(
        startTimeRef.current,
        dx,
        engine.element()?.clientWidth ?? 0,
        SCRUB_RANGE_SECONDS,
        engine.duration(),
      );
      const now = performance.now();
      if (now - lastSeekRef.current < SEEK_THROTTLE_MS) return;
      lastSeekRef.current = now;
      engine.seek(targetRef.current);
    }

    function onPointerEnd(event: PointerEvent) {
      if (pointerIdRef.current !== event.pointerId) return;
      pointerIdRef.current = null;
      const wasScrubbing = scrubbingRef.current;
      const wasHolding = isActive();
      endScrub(event.type !== "pointercancel");
      restore();
      if (wasScrubbing || wasHolding) {
        suppressTapRef.current = true;
        if (event.pointerType === "mouse") consumePointerEvent(event);
      }
    }

    function onTouchEnd(event: TouchEvent) {
      if (suppressTapRef.current || scrubbingRef.current || isActive()) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    }

    function onContextMenu(event: MouseEvent) {
      if (!isActive() || isInteractiveTarget(event.target)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    const options = { capture: true };
    const touchOptions = { capture: true, passive: false };
    const el = engine.element();
    el?.addEventListener("pointerdown", onPointerDown, options);
    window.addEventListener("pointermove", onPointerMove, options);
    window.addEventListener("pointerup", onPointerEnd, options);
    window.addEventListener("pointercancel", onPointerEnd, options);
    el?.addEventListener("touchend", onTouchEnd, touchOptions);
    window.addEventListener("contextmenu", onContextMenu, options);
    return () => {
      el?.removeEventListener("pointerdown", onPointerDown, options);
      window.removeEventListener("pointermove", onPointerMove, options);
      window.removeEventListener("pointerup", onPointerEnd, options);
      window.removeEventListener("pointercancel", onPointerEnd, options);
      el?.removeEventListener("touchend", onTouchEnd, touchOptions);
      window.removeEventListener("contextmenu", onContextMenu, options);
      endScrub(false);
      restore(false);
    };
  }, [canSeek, enabled, engine, start, restore, isActive]);

  return holding;
}
