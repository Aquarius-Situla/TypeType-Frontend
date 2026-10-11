import { type RefObject, useEffect, useRef } from "react";
import { NO_INPUT, type WalkInput } from "./walker";

type Key = keyof WalkInput;

const KEY_CODES: Record<string, Key> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "back",
  ArrowDown: "back",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  ShiftLeft: "run",
  ShiftRight: "run",
};

export function useWalkInput(active: boolean): RefObject<WalkInput> {
  const input = useRef<WalkInput>({ ...NO_INPUT });

  useEffect(() => {
    if (!active) {
      input.current = { ...NO_INPUT };
      return;
    }
    const set = (event: KeyboardEvent, pressed: boolean): void => {
      const key = KEY_CODES[event.code];
      if (!key) return;
      event.preventDefault();
      input.current = { ...input.current, [key]: pressed };
    };
    const down = (event: KeyboardEvent): void => set(event, true);
    const up = (event: KeyboardEvent): void => set(event, false);
    const release = (): void => {
      input.current = { ...NO_INPUT };
    };
    addEventListener("keydown", down);
    addEventListener("keyup", up);
    addEventListener("blur", release);
    return () => {
      removeEventListener("keydown", down);
      removeEventListener("keyup", up);
      removeEventListener("blur", release);
    };
  }, [active]);

  return input;
}
