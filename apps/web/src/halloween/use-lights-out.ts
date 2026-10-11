import { useCallback, useEffect, useRef } from "react";
import { MUSIC, MUSIC_LEVEL, RUN_STEPS, type SoundName, WALK_STEPS } from "./audio-assets";
import type { StepEvent } from "./corridor/walker";
import { isFullyRestored } from "./darkness-paint";
import { createDistantSounds, type DistantSounds } from "./distant-sounds";
import { runLightsOut } from "./lights-out-sequence";
import { useLightsOutStore } from "./lights-out-store";
import { capturePointer, releasePointer } from "./pointer-capture";
import { createSoundBank, type SoundBank } from "./sound-bank";

export type LightsOutControls = {
  start: () => void;
  stop: () => void;
  toggleLamp: () => void;
  playStep: (step: NonNullable<StepEvent>) => void;
  distant: { current: DistantSounds | null };
};

const TORCH_AFTER_DARK_MS = 1300;

function pickVariant(pool: readonly SoundName[], previous: SoundName | null): SoundName {
  const choices = pool.filter((name) => name !== previous);
  return choices[Math.floor(Math.random() * choices.length)] ?? pool[0] ?? "walk1";
}

export function useLightsOut(): LightsOutControls {
  const sounds = useRef<SoundBank | null>(null);
  const abort = useRef<AbortController | null>(null);
  const lastStep = useRef<SoundName | null>(null);
  const distant = useRef<DistantSounds | null>(null);
  const phase = useLightsOutStore((state) => state.phase);

  const toggleLamp = useCallback((): void => {
    const store = useLightsOutStore.getState();
    if (store.phase !== "dark" && store.phase !== "corridor") return;
    const on = !store.lampOn;
    store.setLamp(on, performance.now());
    sounds.current?.play("flashlight", { gain: 0.9, rate: on ? 1 : 0.93 });
    if (on && store.phase === "dark" && sounds.current) {
      store.setPhase("corridor");
      sounds.current.playMusic(MUSIC.creepingDown, MUSIC_LEVEL, 9);
      sounds.current.preloadMusic(MUSIC.sickness);
      distant.current = createDistantSounds(sounds.current, performance.now());
    }
  }, []);

  const start = useCallback((): void => {
    if (useLightsOutStore.getState().phase !== "idle") return;
    const controller = new AbortController();
    abort.current = controller;
    useLightsOutStore.getState().setPhase("loading");
    capturePointer();
    void import("./three/three-corridor");
    createSoundBank()
      .then((bank) => {
        sounds.current = bank;
        return runLightsOut(bank, controller.signal);
      })
      .then(() => new Promise((resolve) => setTimeout(resolve, TORCH_AFTER_DARK_MS)))
      .then(() => {
        if (controller.signal.aborted || useLightsOutStore.getState().lampOn) return;
        toggleLamp();
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error(error);
        useLightsOutStore.getState().reset();
      });
  }, [toggleLamp]);

  const stop = useCallback((): void => {
    const store = useLightsOutStore.getState();
    if (store.phase === "idle" || store.phase === "restoring") return;
    abort.current?.abort();
    releasePointer();
    store.beginRestore(performance.now());
    const bank = sounds.current;
    sounds.current = null;
    distant.current?.stop();
    distant.current = null;
    void bank?.close(0.5);
    const finish = (): void => {
      if (useLightsOutStore.getState().phase !== "restoring") return;
      if (isFullyRestored(performance.now())) useLightsOutStore.getState().reset();
      else requestAnimationFrame(finish);
    };
    requestAnimationFrame(finish);
  }, []);

  const playStep = useCallback((step: NonNullable<StepEvent>): void => {
    const name = pickVariant(step.running ? RUN_STEPS : WALK_STEPS, lastStep.current);
    lastStep.current = name;
    const stairs = step.stairs === true;
    sounds.current?.play(name, {
      gain: (step.running ? 0.7 : 0.55) * (stairs ? 0.9 : 1) * (0.85 + Math.random() * 0.15),
      rate: (stairs ? 0.88 : 0.96) + Math.random() * 0.08,
      pan: step.foot * 0.12,
      reverb: stairs ? 0.8 : step.running ? 0.35 : 0.45,
      echo: stairs ? 0.3 : 0.12,
    });
  }, []);

  useEffect(() => {
    if (phase === "idle") return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") stop();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [phase, stop]);

  return { start, stop, toggleLamp, playStep, distant };
}
