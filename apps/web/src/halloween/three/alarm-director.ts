import type { RefObject } from "react";
import { type AlarmFrame, alarmFrame, alarmInReach } from "../corridor/fire-alarm";
import type { Walker } from "../corridor/walker";
import { useCorridorHint } from "../corridor-hint-store";
import type { DistantSounds } from "../distant-sounds";

export type AlarmDirector = {
  update: (walker: Walker, now: number, allowed: boolean) => AlarmFrame | null;
  pulledAt: () => number | null;
  cancel: () => void;
  release: () => void;
  dispose: () => void;
};

export function createAlarmDirector(sounds: RefObject<DistantSounds | null>): AlarmDirector {
  let inReach = false;
  let pulled = false;
  let pulledAt: number | null = null;
  let cut = false;
  let cancelled = false;
  let stopSiren = (): void => undefined;
  const reset = (): void => {
    pulled = false;
    pulledAt = null;
    cut = false;
    cancelled = false;
  };
  const onKey = (event: KeyboardEvent): void => {
    if (event.code !== "KeyE" || event.repeat || !inReach || pulled) return;
    pulled = true;
  };
  addEventListener("keydown", onKey);

  return {
    update(walker, now, allowed) {
      inReach = !pulled && allowed && alarmInReach(walker) !== null;
      useCorridorHint.getState().setHint(inReach ? "alarm" : null);
      if (pulled && pulledAt === null) {
        pulledAt = now;
        stopSiren = sounds.current?.close.alarm() ?? stopSiren;
      }
      if (pulledAt === null || cancelled) return null;
      const frame = alarmFrame(now - pulledAt);
      if (!frame.siren && !cut) {
        cut = true;
        sounds.current?.close.powerCut();
      }
      if (frame.done) reset();
      return frame.done ? null : frame;
    },
    pulledAt: () => pulledAt,
    cancel() {
      if (cancelled) return;
      cancelled = true;
      stopSiren();
    },
    release() {
      if (cancelled) reset();
    },
    dispose() {
      removeEventListener("keydown", onKey);
      useCorridorHint.getState().setHint(null);
    },
  };
}
