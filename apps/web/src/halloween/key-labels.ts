import { create } from "zustand";

export type KeyCode = "KeyW" | "KeyA" | "KeyS" | "KeyD" | "KeyE";
export type KeyLabels = Record<KeyCode, string>;

const KEY_CODES: readonly KeyCode[] = ["KeyW", "KeyA", "KeyS", "KeyD", "KeyE"];
const QWERTY: KeyLabels = { KeyW: "W", KeyA: "A", KeyS: "S", KeyD: "D", KeyE: "E" };
const AZERTY: KeyLabels = { KeyW: "Z", KeyA: "Q", KeyS: "S", KeyD: "D", KeyE: "E" };

const isKeyCode = (code: string): code is KeyCode => KEY_CODES.some((known) => known === code);

export function guessLabels(language: string): KeyLabels {
  return /^(fr(-(fr|be|lu|mc))?|nl-be)$/i.test(language) ? AZERTY : QWERTY;
}

export function labelOf(key: string): string | null {
  return key.length === 1 && key.toLowerCase() !== key.toUpperCase() ? key.toUpperCase() : null;
}

type KeyLabelState = {
  labels: KeyLabels;
  learn: (code: string, key: string) => void;
};

export const useKeyLabels = create<KeyLabelState>()((set, get) => ({
  labels: guessLabels(typeof navigator === "undefined" ? "" : navigator.language),
  learn: (code, key) => {
    const label = labelOf(key);
    if (!label || !isKeyCode(code) || get().labels[code] === label) return;
    set({ labels: { ...get().labels, [code]: label } });
  },
}));

export function watchKeyLayout(): () => void {
  const { learn } = useKeyLabels.getState();
  void navigator.keyboard
    ?.getLayoutMap()
    .then((map) => {
      for (const code of KEY_CODES) learn(code, map.get(code) ?? "");
    })
    .catch(() => undefined);
  const onKey = (event: KeyboardEvent): void => learn(event.code, event.key);
  addEventListener("keydown", onKey);
  return () => removeEventListener("keydown", onKey);
}
