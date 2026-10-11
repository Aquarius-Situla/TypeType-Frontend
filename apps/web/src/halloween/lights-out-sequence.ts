import { BANK_CLUNKS } from "./audio-assets";
import { BANK_COUNT } from "./light-banks";
import { useLightsOutStore } from "./lights-out-store";
import type { SoundBank } from "./sound-bank";

const HUM_LEVEL = 0.32;
const HUM_FADE_IN_S = 1.2;
const BEFORE_FLICKER_MS = 2200;
const FLICKER_MS = 140;
const BEFORE_CUT_MS = 1500;
const BETWEEN_BANKS_MS = [950, 800, 650];
const BANK_PANS = [0.65, 0.2, -0.2, -0.5];
const BANK_GAINS = [0.5, 0.65, 0.8, 0.95];
const BANK_ECHO = [0.5, 0.4, 0.3, 0.22];

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

export async function runLightsOut(sounds: SoundBank, signal: AbortSignal): Promise<void> {
  const store = useLightsOutStore.getState();
  store.setPhase("humming");
  sounds.startHum(HUM_LEVEL, HUM_FADE_IN_S);
  await wait(BEFORE_FLICKER_MS, signal);
  store.flickerBank(1, performance.now(), FLICKER_MS);
  sounds.setHumLevel(HUM_LEVEL * 0.6, 0.03);
  await wait(FLICKER_MS, signal);
  sounds.setHumLevel(HUM_LEVEL, 0.05);
  await wait(BEFORE_CUT_MS, signal);

  store.setPhase("cutting");
  for (let bank = 0; bank < BANK_COUNT; bank += 1) {
    if (bank > 0) await wait(BETWEEN_BANKS_MS[bank - 1] ?? 700, signal);
    store.switchOffBank(bank, performance.now());
    sounds.play(BANK_CLUNKS[bank] ?? "clunk1", {
      gain: BANK_GAINS[bank],
      pan: BANK_PANS[bank],
      echo: BANK_ECHO[bank],
    });
    const remaining = (BANK_COUNT - bank - 1) / BANK_COUNT;
    sounds.setHumLevel(HUM_LEVEL * remaining, remaining > 0 ? 0.06 : 0.35);
  }
  sounds.play("powerDie", { gain: 0.45, pan: -0.1, echo: 0.2 });
  store.setPhase("dark");
}
