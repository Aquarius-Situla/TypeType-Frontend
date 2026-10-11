import type { RefObject } from "react";
import { useRef } from "react";
import { m } from "../paraglide/messages.js";
import type { WalkInput } from "./corridor/walker";
import { useLightsOutStore } from "./lights-out-store";

type Props = {
  onToggle: () => void;
  input: RefObject<WalkInput>;
};

const HOLD_MS = 220;
const TAP_DRIFT_PX = 12;

type Touch = { x: number; y: number; at: number };

export function LampClickLayer({ onToggle, input }: Props) {
  const touches = useRef(new Map<number, Touch>());
  const holdTimer = useRef(0);
  const blocking = useLightsOutStore(
    (state) =>
      state.phase === "humming" ||
      state.phase === "cutting" ||
      state.phase === "dark" ||
      state.phase === "corridor",
  );
  if (!blocking) return null;

  const setWalk = (forward: boolean, run: boolean): void => {
    input.current = { ...input.current, forward, run };
  };

  const onPointerDown = (event: React.PointerEvent): void => {
    if (event.pointerType === "mouse") return;
    touches.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      at: performance.now(),
    });
    clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      if (touches.current.size > 0) setWalk(true, touches.current.size > 1);
    }, HOLD_MS);
  };

  const onPointerUp = (event: React.PointerEvent): void => {
    const touch = touches.current.get(event.pointerId);
    touches.current.delete(event.pointerId);
    if (!touch) return;
    const drift = Math.hypot(event.clientX - touch.x, event.clientY - touch.y);
    const quick = performance.now() - touch.at < HOLD_MS;
    if (touches.current.size === 0) {
      clearTimeout(holdTimer.current);
      setWalk(false, false);
    } else {
      setWalk(true, false);
    }
    if (quick && drift < TAP_DRIFT_PX) onToggle();
  };

  return (
    <button
      type="button"
      aria-label={m.halloween_flashlight_toggle()}
      className="fixed inset-0 z-[70] h-full w-full cursor-none touch-none bg-transparent outline-none"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onToggle();
      }}
    />
  );
}
