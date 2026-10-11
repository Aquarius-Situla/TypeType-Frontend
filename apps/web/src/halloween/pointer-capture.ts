import { useEffect } from "react";
import type { LightsOutPhase } from "./lights-out-store";

const CAPTURING: readonly LightsOutPhase[] = ["loading", "humming", "cutting", "dark", "corridor"];

export function pointerCaptured(): boolean {
  return document.pointerLockElement !== null;
}

export function capturePointer(): void {
  if (pointerCaptured()) return;
  Promise.resolve(document.documentElement.requestPointerLock()).catch(() => undefined);
}

export function releasePointer(): void {
  if (pointerCaptured()) document.exitPointerLock();
}

export function usePointerClicks(phase: LightsOutPhase, onToggle: () => void): void {
  useEffect(() => {
    if (!CAPTURING.includes(phase)) return;
    const onDown = (event: PointerEvent): void => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      if (pointerCaptured()) onToggle();
      else capturePointer();
    };
    addEventListener("pointerdown", onDown);
    return () => removeEventListener("pointerdown", onDown);
  }, [phase, onToggle]);
}
